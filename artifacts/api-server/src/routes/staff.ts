import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, staffTable, staffAvailabilityTable, jobAssignmentsTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

// List staff (optionally filter by tenant)
router.get("/staff", async (req, res): Promise<void> => {
  const tenantId = req.query.tenantId as string | undefined;
  const rows = await db
    .select()
    .from(staffTable)
    .where(tenantId ? eq(staffTable.tenantId, tenantId) : undefined)
    .orderBy(desc(staffTable.createdAt));
  res.json(rows);
});

// Get single staff member with assignment count
router.get("/staff/:id", async (req, res): Promise<void> => {
  const [staff] = await db.select().from(staffTable).where(eq(staffTable.id, req.params.id));
  if (!staff) { res.status(404).json({ error: "Staff not found" }); return; }
  const assignments = await db.select().from(jobAssignmentsTable).where(eq(jobAssignmentsTable.staffId, staff.id));
  res.json({ ...staff, assignmentCount: assignments.length, recentAssignments: assignments.slice(-5) });
});

// Create staff
router.post("/staff", async (req, res): Promise<void> => {
  const b = req.body;
  if (!b.tenantId || !b.name || !b.email || !b.phone || !b.baseSuburb || !b.baseState) {
    res.status(400).json({ error: "tenantId, name, email, phone, baseSuburb, baseState are required" });
    return;
  }
  const [row] = await db
    .insert(staffTable)
    .values({
      id:             randomUUID(),
      tenantId:       b.tenantId,
      name:           b.name,
      email:          b.email,
      phone:          b.phone,
      role:           b.role ?? "cleaner",
      skills:         b.skills ?? [],
      maxJobsPerDay:  b.maxJobsPerDay ?? 3,
      baseSuburb:     b.baseSuburb,
      baseState:      b.baseState,
      lat:            b.lat ?? null,
      lng:            b.lng ?? null,
      vehicleType:    b.vehicleType ?? "car",
      rating:         b.rating ?? 5.0,
      active:         b.active ?? true,
      notes:          b.notes ?? null,
    })
    .returning();
  res.status(201).json(row);
});

// Update staff
router.patch("/staff/:id", async (req, res): Promise<void> => {
  const b = req.body;
  const allowed = ["name","email","phone","role","skills","maxJobsPerDay","baseSuburb","baseState","lat","lng","vehicleType","rating","active","notes"] as const;
  const updates: Record<string, unknown> = {};
  for (const k of allowed) { if (k in b) updates[k] = b[k]; }

  const [row] = await db
    .update(staffTable)
    .set(updates as any)
    .where(eq(staffTable.id, req.params.id))
    .returning();
  if (!row) { res.status(404).json({ error: "Staff not found" }); return; }
  res.json(row);
});

// Toggle active
router.patch("/staff/:id/toggle", async (req, res): Promise<void> => {
  const [current] = await db.select().from(staffTable).where(eq(staffTable.id, req.params.id));
  if (!current) { res.status(404).json({ error: "Staff not found" }); return; }
  const [row] = await db
    .update(staffTable)
    .set({ active: !current.active })
    .where(eq(staffTable.id, req.params.id))
    .returning();
  res.json(row);
});

// Delete staff
router.delete("/staff/:id", async (req, res): Promise<void> => {
  await db.delete(staffTable).where(eq(staffTable.id, req.params.id));
  res.status(204).send();
});

// Set availability for a staff member on a date
router.put("/staff/:id/availability/:date", async (req, res): Promise<void> => {
  const { id, date } = req.params;
  const { timeSlots } = req.body;
  if (!Array.isArray(timeSlots)) { res.status(400).json({ error: "timeSlots must be an array" }); return; }

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
});

// Get availability
router.get("/staff/:id/availability", async (req, res): Promise<void> => {
  const rows = await db.select().from(staffAvailabilityTable).where(eq(staffAvailabilityTable.staffId, req.params.id));
  res.json(rows);
});

export default router;
