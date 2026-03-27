import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, staffTable, staffAvailabilityTable, jobAssignmentsTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

// List staff (optionally filter by tenant)
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

// Get single staff member with assignment count
router.get("/staff/:id", async (req, res): Promise<void> => {
  try {
    const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, req.params.id));
    if (!staff) { res.status(404).json({ error: "Staff not found" }); return; }
    const assignments = await db.select().from(jobAssignmentsTable).where(eq(jobAssignmentsTable.staffId, staff.id));
    res.json({ ...staff, assignmentCount: assignments.length, recentAssignments: assignments.slice(-5) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

// Create staff
router.post("/staff", async (req, res): Promise<void> => {
  const b = req.body;
  if (!b.tenantId || !b.name || !b.email || !b.phone || !b.baseSuburb || !b.baseState) {
    res.status(400).json({ error: "tenantId, name, email, phone, baseSuburb, baseState are required" });
    return;
  }

  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) {
    res.status(400).json({ error: "Invalid email address" });
    return;
  }

  // Australian phone format (basic)
  if (b.phone && !/^(\+?61|0)[2-9]\d{8}$/.test(b.phone.replace(/\s/g, ""))) {
    res.status(400).json({ error: "Phone must be an Australian number (e.g. 0412345678)" });
    return;
  }

  try {
    // Check email uniqueness within tenant
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
        id:             randomUUID(),
        tenantId:       b.tenantId,
        name:           String(b.name).trim(),
        email:          String(b.email).trim().toLowerCase(),
        phone:          String(b.phone).trim(),
        role:           b.role ?? "cleaner",
        skills:         Array.isArray(b.skills) ? b.skills : [],
        maxJobsPerDay:  Math.max(1, Math.min(20, Number(b.maxJobsPerDay) || 3)),
        baseSuburb:     String(b.baseSuburb).trim(),
        baseState:      String(b.baseState).trim().toUpperCase(),
        lat:            b.lat != null ? Number(b.lat) : null,
        lng:            b.lng != null ? Number(b.lng) : null,
        vehicleType:    b.vehicleType ?? "car",
        rating:         Math.min(5, Math.max(1, Number(b.rating) || 5.0)),
        active:         b.active !== false,
        notes:          b.notes ? String(b.notes) : null,
      })
      .returning();
    res.status(201).json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Insert failed";
    res.status(500).json({ error: msg });
  }
});

// Update staff
router.patch("/staff/:id", async (req, res): Promise<void> => {
  const b = req.body;
  const allowed = [
    "name","email","phone","role","skills","maxJobsPerDay",
    "baseSuburb","baseState","lat","lng","vehicleType","rating","active","notes",
  ] as const;
  const updates: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in b) updates[k] = b[k];
  }

  // Sanitize string fields
  if (typeof updates.name === "string")       updates.name       = updates.name.trim();
  if (typeof updates.email === "string")      updates.email      = updates.email.trim().toLowerCase();
  if (typeof updates.baseSuburb === "string") updates.baseSuburb = updates.baseSuburb.trim();
  if (typeof updates.baseState === "string")  updates.baseState  = updates.baseState.trim().toUpperCase();

  try {
    const [row] = await db
      .update(staffTable)
      .set(updates as Parameters<typeof staffTable.$inferInsert>[0])
      .where(eq(staffTable.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "Staff not found" }); return; }
    res.json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    res.status(500).json({ error: msg });
  }
});

// Toggle active
router.patch("/staff/:id/toggle", async (req, res): Promise<void> => {
  try {
    const [current] = await db.select().from(staffTable).where(eq(staffTable.id, req.params.id));
    if (!current) { res.status(404).json({ error: "Staff not found" }); return; }
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

// Delete (deactivate) staff — soft delete by setting active=false if assignments exist
router.delete("/staff/:id", async (req, res): Promise<void> => {
  try {
    const [activeAssignment] = await db
      .select({ id: jobAssignmentsTable.id })
      .from(jobAssignmentsTable)
      .where(and(
        eq(jobAssignmentsTable.staffId, req.params.id),
        eq(jobAssignmentsTable.status, "assigned"),
      ));

    if (activeAssignment) {
      // Soft-delete: deactivate instead of hard-delete to preserve assignment history
      await db.update(staffTable).set({ active: false }).where(eq(staffTable.id, req.params.id));
      res.status(200).json({ message: "Staff member deactivated (has active assignments)" });
      return;
    }

    await db.delete(staffTable).where(eq(staffTable.id, req.params.id));
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    res.status(500).json({ error: msg });
  }
});

// Upsert availability for a staff member on a date
router.put("/staff/:id/availability/:date", async (req, res): Promise<void> => {
  const { id, date } = req.params;
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

// Get availability
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
