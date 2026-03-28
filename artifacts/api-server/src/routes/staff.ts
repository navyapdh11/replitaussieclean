import { Router, type IRouter } from "express";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import { db, staffTable, staffAvailabilityTable, jobAssignmentsTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

/* ── Shared regex patterns ───────────────────────────────────────────────── */
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/**
 * Australian phone number:
 *  - Mobile:    04XX XXX XXX  (10 digits)
 *  - Landline:  0[23578] XXXX XXXX (10 digits)
 *  - Freecall:  1300 XXX XXX (10 digits) | 1800 XXX XXX (10 digits)
 *  - Intl:      +61 followed by any of the above (minus leading 0)
 * Spaces/hyphens/parens stripped before matching.
 */
const PHONE_AU_RE = /^(\+?61(2|3|4|7|8)\d{8}|0(2|3|4|7|8)\d{8}|1[38]00\d{6})$/;

/* ── GET /staff ─────────────────────────────────────────────────────────── */
router.get("/staff", async (req, res): Promise<void> => {
  const tenantId = req.query.tenantId as string | undefined;
  try {
    const rows = await db
      .select()
      .from(staffTable)
      .where(tenantId ? eq(staffTable.tenantId, tenantId) : undefined)
      .orderBy(desc(staffTable.createdAt));
    res.json(rows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

/* ── GET /staff/:id ─────────────────────────────────────────────────────── */
router.get("/staff/:id", async (req, res): Promise<void> => {
  try {
    const [staff] = await db
      .select()
      .from(staffTable)
      .where(eq(staffTable.id, req.params.id));

    if (!staff) {
      res.status(404).json({ error: "Staff not found" });
      return;
    }

    /* Fetch recent assignments and total count in parallel — no memory-slicing */
    const [recentAssignments, [{ total }]] = await Promise.all([
      db
        .select()
        .from(jobAssignmentsTable)
        .where(eq(jobAssignmentsTable.staffId, staff.id))
        .orderBy(desc(jobAssignmentsTable.assignedAt))
        .limit(5),
      db
        .select({ total: count(jobAssignmentsTable.id) })
        .from(jobAssignmentsTable)
        .where(eq(jobAssignmentsTable.staffId, staff.id)),
    ]);

    res.json({ ...staff, assignmentCount: Number(total ?? 0), recentAssignments });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

/* ── POST /staff ────────────────────────────────────────────────────────── */
router.post("/staff", async (req, res): Promise<void> => {
  const b = req.body;
  if (!b.tenantId || !b.name || !b.email || !b.phone || !b.baseSuburb || !b.baseState) {
    res.status(400).json({ error: "tenantId, name, email, phone, baseSuburb, baseState are required" });
    return;
  }

  if (!EMAIL_RE.test(b.email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  if (!PHONE_AU_RE.test(String(b.phone).replace(/[\s\-()]/g, ""))) {
    res.status(400).json({ error: "Phone must be a valid Australian number (e.g. 0412 345 678, 1300 123 456)" });
    return;
  }

  try {
    const [existing] = await db
      .select({ id: staffTable.id })
      .from(staffTable)
      .where(and(eq(staffTable.email, b.email), eq(staffTable.tenantId, b.tenantId)));

    if (existing) {
      res.status(409).json({ error: "A staff member with that email already exists" });
      return;
    }

    const [row] = await db
      .insert(staffTable)
      .values({
        id:            randomUUID(),
        tenantId:      b.tenantId,
        name:          String(b.name).trim(),
        email:         String(b.email).trim().toLowerCase(),
        phone:         String(b.phone).trim(),
        role:          b.role ?? "cleaner",
        skills:        Array.isArray(b.skills) ? b.skills : [],
        maxJobsPerDay: Math.max(1, Math.min(20, Number(b.maxJobsPerDay) || 3)),
        baseSuburb:    String(b.baseSuburb).trim(),
        baseState:     String(b.baseState).trim().toUpperCase(),
        lat:           b.lat != null ? Number(b.lat) : null,
        lng:           b.lng != null ? Number(b.lng) : null,
        vehicleType:   b.vehicleType ?? "car",
        rating:        Math.min(5, Math.max(1, Number(b.rating) || 5.0)),
        active:        b.active !== false,
        notes:         b.notes ? String(b.notes) : null,
      })
      .returning();

    res.status(201).json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Insert failed";
    res.status(500).json({ error: msg });
  }
});

/* ── PATCH /staff/:id ───────────────────────────────────────────────────── */
router.patch("/staff/:id", async (req, res): Promise<void> => {
  const b = req.body;
  const allowed = [
    "name", "email", "phone", "role", "skills", "maxJobsPerDay",
    "baseSuburb", "baseState", "lat", "lng", "vehicleType", "rating", "active", "notes",
  ] as const;
  const updates: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in b) updates[k] = b[k];
  }

  /* Re-validate email format if being updated */
  if (typeof updates.email === "string") {
    const email = updates.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      res.status(400).json({ error: "Invalid email address" });
      return;
    }
    updates.email = email;
  }

  /* Re-validate phone format if being updated */
  if (typeof updates.phone === "string") {
    const phone = updates.phone;
    const normalised = phone.replace(/[\s\-()]/g, "");
    if (!PHONE_AU_RE.test(normalised)) {
      res.status(400).json({ error: "Phone must be a valid Australian number (e.g. 0412 345 678, 1300 123 456)" });
      return;
    }
  }

  /* Sanitize remaining string fields */
  if (typeof updates.name === "string")       updates.name       = updates.name.trim();
  if (typeof updates.baseSuburb === "string") updates.baseSuburb = updates.baseSuburb.trim();
  if (typeof updates.baseState === "string")  updates.baseState  = updates.baseState.trim().toUpperCase();

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No updatable fields provided" });
    return;
  }

  try {
    const [row] = await db
      .update(staffTable)
      .set(updates as Partial<typeof staffTable.$inferInsert>)
      .where(eq(staffTable.id, req.params.id))
      .returning();

    if (!row) {
      res.status(404).json({ error: "Staff not found" });
      return;
    }
    res.json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    res.status(500).json({ error: msg });
  }
});

/* ── PATCH /staff/:id/toggle ────────────────────────────────────────────── */
router.patch("/staff/:id/toggle", async (req, res): Promise<void> => {
  try {
    const [current] = await db
      .select()
      .from(staffTable)
      .where(eq(staffTable.id, req.params.id));

    if (!current) {
      res.status(404).json({ error: "Staff not found" });
      return;
    }

    const [row] = await db
      .update(staffTable)
      .set({ active: !current.active })
      .where(eq(staffTable.id, req.params.id))
      .returning();

    res.json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    res.status(500).json({ error: msg });
  }
});

/* ── DELETE /staff/:id ──────────────────────────────────────────────────── */
router.delete("/staff/:id", async (req, res): Promise<void> => {
  try {
    /* Block hard-delete if any assignment is still active or in-progress.
       Single query with inArray avoids two round-trips and closes the race
       window between the two reads. */
    const [activeAssignment] = await db
      .select({ id: jobAssignmentsTable.id })
      .from(jobAssignmentsTable)
      .where(and(
        eq(jobAssignmentsTable.staffId, req.params.id),
        inArray(jobAssignmentsTable.status, ["assigned", "in_progress"]),
      ))
      .limit(1);

    if (activeAssignment) {
      /* Soft-delete: deactivate to preserve assignment history */
      await db
        .update(staffTable)
        .set({ active: false })
        .where(eq(staffTable.id, req.params.id));
      res.status(200).json({ message: "Staff member deactivated (has active or in-progress assignments)" });
      return;
    }

    await db.delete(staffTable).where(eq(staffTable.id, req.params.id));
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    res.status(500).json({ error: msg });
  }
});

/* ── PUT /staff/:id/availability/:date ─────────────────────────────────── */
router.put("/staff/:id/availability/:date", async (req, res): Promise<void> => {
  const { id, date } = req.params;

  /* Validate date format */
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || isNaN(Date.parse(date))) {
    res.status(400).json({ error: "date must be a valid YYYY-MM-DD string" });
    return;
  }

  const { timeSlots } = req.body;
  if (!Array.isArray(timeSlots)) {
    res.status(400).json({ error: "timeSlots must be an array" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(staffAvailabilityTable)
      .where(and(eq(staffAvailabilityTable.staffId, id), eq(staffAvailabilityTable.date, date)));

    if (existing) {
      const [row] = await db
        .update(staffAvailabilityTable)
        .set({ timeSlots })
        .where(and(eq(staffAvailabilityTable.staffId, id), eq(staffAvailabilityTable.date, date)))
        .returning();
      res.json(row);
    } else {
      const [row] = await db
        .insert(staffAvailabilityTable)
        .values({ id: randomUUID(), staffId: id, date, timeSlots })
        .returning();
      res.status(201).json(row);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Availability update failed";
    res.status(500).json({ error: msg });
  }
});

/* ── GET /staff/:id/availability ────────────────────────────────────────── */
router.get("/staff/:id/availability", async (req, res): Promise<void> => {
  try {
    const rows = await db
      .select()
      .from(staffAvailabilityTable)
      .where(eq(staffAvailabilityTable.staffId, req.params.id));
    res.json(rows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
