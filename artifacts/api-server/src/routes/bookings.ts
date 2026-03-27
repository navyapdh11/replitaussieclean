import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
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

function serializeBooking(booking: Record<string, unknown>) {
  return {
    ...booking,
    createdAt: booking.createdAt instanceof Date ? booking.createdAt.toISOString() : booking.createdAt,
    updatedAt: booking.updatedAt instanceof Date ? booking.updatedAt.toISOString() : booking.updatedAt,
  };
}

const router: IRouter = Router();

router.get("/bookings", async (req, res): Promise<void> => {
  const query = ListBookingsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.email) conditions.push(eq(bookingsTable.email, query.data.email));
  if (query.data.status) conditions.push(eq(bookingsTable.status, query.data.status));

  const bookings = await db
    .select()
    .from(bookingsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(bookingsTable.createdAt);

  res.json(ListBookingsResponse.parse(bookings.map(serializeBooking)));
});

router.post("/bookings", async (req, res): Promise<void> => {
  const parsed = CreateBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.errors });
    return;
  }

  const d = parsed.data;
  const [booking] = await db
    .insert(bookingsTable)
    .values({
      id: randomUUID(),
      status: "pending",
      serviceType: d.serviceType,
      propertyType: d.propertyType,
      bedrooms: d.bedrooms,
      bathrooms: d.bathrooms,
      extras: d.extras ?? [],
      date: d.date,
      timeSlot: d.timeSlot,
      addressLine1: d.addressLine1,
      addressLine2: d.addressLine2 ?? null,
      suburb: d.suburb,
      state: d.state,
      postcode: d.postcode,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      notes: d.notes ?? null,
      quoteAmountCents: d.quoteAmountCents ?? 0,
      gstAmountCents: d.gstAmountCents ?? 0,
      currency: "AUD",
    })
    .returning();

  res.status(201).json(GetBookingResponse.parse(serializeBooking(booking)));
});

router.get("/bookings/:id", async (req, res): Promise<void> => {
  const params = GetBookingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(eq(bookingsTable.id, params.data.id));

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(GetBookingResponse.parse(serializeBooking(booking)));
});

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

  const updates: Partial<typeof bookingsTable.$inferInsert> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.stripeSessionId !== undefined) updates.stripeSessionId = parsed.data.stripeSessionId;
  if (parsed.data.stripePaymentId !== undefined) updates.stripePaymentId = parsed.data.stripePaymentId;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;

  const [booking] = await db
    .update(bookingsTable)
    .set(updates)
    .where(eq(bookingsTable.id, params.data.id))
    .returning();

  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }

  res.json(UpdateBookingResponse.parse(serializeBooking(booking)));
});

export default router;
