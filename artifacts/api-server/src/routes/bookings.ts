import { Router, type IRouter } from "express";
import type { Request } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, bookingsTable } from "@workspace/db";
import {
  CreateBookingBody,
  ListBookingsQueryParams,
  ListBookingsResponse,
  GetBookingParams,
  GetBookingResponse,
  UpdateBookingParams,
  UpdateBookingBody,
  UpdateBookingResponse,
} from "@workspace/api-zod";
import { randomUUID } from "crypto";
import { bookingLimiter } from "../lib/ratelimit";

/** Resolve tenant ID from request — supports multi-tenant isolation.
 *
 * Priority:
 *  1. `x-tenant-id` header (set by upstream auth/proxy)
 *  2. `tenantId` query parameter (public endpoints, e.g. dashboard search)
 *  3. Falls back to no filter when MULTI_TENANT_MODE is not enabled
 */
function resolveTenantId(req: Request): string | null {
  const headerId = req.headers["x-tenant-id"];
  if (typeof headerId === "string" && headerId.length > 0) return headerId;

  const queryId = req.query.tenantId as string | undefined;
  if (typeof queryId === "string" && queryId.length > 0) return queryId;

  // When multi-tenant mode is off, don't filter — single-tenant deployment
  if (process.env.MULTI_TENANT_MODE !== "true") return null;

  return null;
}

/**
 * Allowed forward transitions for each booking status.
 * An empty array means the status is terminal.
 * Any transition NOT listed here is rejected with 409.
 */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft:       ["pending", "cancelled"],
  pending:     ["confirmed", "cancelled"],
  confirmed:   ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed:   [],
  cancelled:   ["pending"], // admin re-open
};

function serializeBooking(booking: Record<string, unknown>) {
  return {
    ...booking,
    createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
    updatedAt: booking.updatedAt instanceof Date ? booking.updatedAt.toISOString() : booking.updatedAt,
  };
}

const router: IRouter = Router();

/* ── GET /bookings ────────────────────────────────────────── */
router.get("/bookings", async (req, res): Promise<void> => {
  const query = ListBookingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  try {
    const conditions = [];
    const tenantId = resolveTenantId(req);
    if (tenantId) conditions.push(eq(bookingsTable.tenantId, tenantId));
    if (query.data.email)  conditions.push(eq(bookingsTable.email,  query.data.email));
    if (query.data.status) conditions.push(eq(bookingsTable.status, query.data.status));

    /* limit/offset are not in the Zod schema — parse from req.query with safe defaults.
     * Use explicit NaN check so limit=0 is honoured (parseInt("0") || 100 would incorrectly return 100). */
    const rawLimit  = parseInt((req.query.limit  as string) ?? "", 10);
    const rawOffset = parseInt((req.query.offset as string) ?? "", 10);
    const limit  = Math.min(200, Math.max(0, isNaN(rawLimit)  ? 100 : rawLimit));
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset);

    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bookingsTable.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(ListBookingsResponse.parse(bookings.map(serializeBooking)));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to list bookings: ${msg}` });
  }
});

/* ── POST /bookings ───────────────────────────────────────── */
router.post("/bookings", bookingLimiter, async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
    return;
  }

  try {
    const d = parsed.data;
    const tenantId = resolveTenantId(req);
    const [booking] = await db
      .insert(bookingsTable)
      .values({
        id: randomUUID(),
        status: "pending",
        tenantId:         tenantId ?? undefined,
        serviceType:      d.serviceType,
        propertyType:     d.propertyType,
        bedrooms:         d.bedrooms,
        bathrooms:        d.bathrooms,
        extras:           d.extras ?? [],
        date:             d.date,
        timeSlot:         d.timeSlot,
        addressLine1:     d.addressLine1,
        addressLine2:     d.addressLine2 ?? null,
        suburb:           d.suburb,
        state:            d.state,
        postcode:         d.postcode,
        firstName:        d.firstName,
        lastName:         d.lastName,
        email:            d.email,
        phone:            d.phone,
        notes:            d.notes ?? null,
        quoteAmountCents: d.quoteAmountCents ?? 0,
        gstAmountCents:   d.gstAmountCents   ?? 0,
        currency:         "AUD",
      })
      .returning();

    res.status(201).json(GetBookingResponse.parse(serializeBooking(booking)));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to create booking: ${msg}` });
  }
});

/* ── GET /bookings/:id ────────────────────────────────────── */
router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  try {
    const tenantId = resolveTenantId(req);
    const whereClauses = [eq(bookingsTable.id, params.data.id)];
    if (tenantId) whereClauses.push(eq(bookingsTable.tenantId, tenantId));

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(and(...whereClauses));

    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    res.json(GetBookingResponse.parse(serializeBooking(booking)));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to fetch booking: ${msg}` });
  }
});

/* ── PATCH /bookings/:id ──────────────────────────────────── */
router.patch("/bookings/:id", async (req, res): Promise<void> => {
  const params = UpdateBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const updates: Partial<typeof bookingsTable.$inferInsert> = {};
    if (parsed.data.stripeSessionId !== undefined) updates.stripeSessionId = parsed.data.stripeSessionId;
    if (parsed.data.stripePaymentId !== undefined) updates.stripePaymentId = parsed.data.stripePaymentId;
    if (parsed.data.notes           !== undefined) updates.notes           = parsed.data.notes;

    // Tenant isolation: verify booking belongs to requesting tenant
    const tenantId = resolveTenantId(req);
    const tenantFilter = tenantId ? eq(bookingsTable.tenantId, tenantId) : undefined;

    if (parsed.data.status !== undefined) {
      // Atomic compare-and-set: fetch current status, validate transition,
      // then UPDATE with an extra WHERE clause on the expected status.
      // This prevents the SELECT→UPDATE race condition where two concurrent
      // requests both pass the status check and both apply the transition.
      const whereClauses = [eq(bookingsTable.id, params.data.id)];
      if (tenantFilter) whereClauses.push(tenantFilter);

      const [current] = await db
        .select({ status: bookingsTable.status })
        .from(bookingsTable)
        .where(and(...whereClauses))
        .limit(1);

      if (!current) {
        res.status(404).json({ error: "Booking not found" });
        return;
      }

      const allowed = STATUS_TRANSITIONS[current.status] ?? [];
      if (!allowed.includes(parsed.data.status)) {
        res.status(409).json({
          error: `Invalid status transition: ${current.status} → ${parsed.data.status}`,
          allowedTransitions: allowed,
        });
        return;
      }

      updates.status = parsed.data.status;

      // CAS update: only apply if status hasn't changed since we read it.
      const casWhere = [eq(bookingsTable.id, params.data.id), eq(bookingsTable.status, current.status)];
      if (tenantFilter) casWhere.push(tenantFilter);

      const [booking] = await db
        .update(bookingsTable)
        .set(updates)
        .where(and(...casWhere))
        .returning();

      if (!booking) {
        // Affected 0 rows — either not found or status changed underneath us
        res.status(409).json({ error: "Booking status changed concurrently. Please retry." });
        return;
      }

      res.json(UpdateBookingResponse.parse(serializeBooking(booking)));
      return;
    }

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No updatable fields provided" });
      return;
    }

    const nonStatusWhere = [eq(bookingsTable.id, params.data.id)];
    if (tenantFilter) nonStatusWhere.push(tenantFilter);

    const [booking] = await db
      .update(bookingsTable)
      .set(updates)
      .where(and(...nonStatusWhere))
      .returning();

    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    res.json(UpdateBookingResponse.parse(serializeBooking(booking)));
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    res.status(500).json({ error: `Failed to update booking: ${msg}` });
  }
});

export default router;
