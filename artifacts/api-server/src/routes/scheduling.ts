import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, jobAssignmentsTable, staffTable, bookingsTable } from "@workspace/db";
import { optimizeSchedule, manualAssign } from "../lib/scheduler";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

// POST /api/scheduling/optimize — run automatic optimization for a date
router.post("/scheduling/optimize", async (req, res): Promise<void> => {
  const { tenantId, date } = req.body;
  if (!tenantId || !date) { res.status(400).json({ error: "tenantId and date are required" }); return; }

  try {
    const result = await optimizeSchedule(tenantId, date);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? "Optimization failed" });
  }
});

// POST /api/scheduling/assign — manual assignment
router.post("/scheduling/assign", async (req, res): Promise<void> => {
  const { tenantId, bookingId, staffId } = req.body;
  if (!tenantId || !bookingId || !staffId) {
    res.status(400).json({ error: "tenantId, bookingId, and staffId are required" });
    return;
  }
  try {
    const result = await manualAssign(tenantId, bookingId, staffId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message ?? "Assignment failed" });
  }
});

// DELETE /api/scheduling/assign/:bookingId — remove assignment
router.delete("/scheduling/assign/:bookingId", async (req, res): Promise<void> => {
  await db.delete(jobAssignmentsTable).where(eq(jobAssignmentsTable.bookingId, req.params.bookingId));
  await db.update(bookingsTable).set({ assignedStaffId: null }).where(eq(bookingsTable.id, req.params.bookingId));
  res.status(204).send();
});

// GET /api/scheduling/assignments
router.get("/scheduling/assignments", async (req, res): Promise<void> => {
  const tenantId = req.query.tenantId as string | undefined;
  const rows = await db
    .select({
      assignment: jobAssignmentsTable,
      staff: {
        id: staffTable.id,
        name: staffTable.name,
        phone: staffTable.phone,
        rating: staffTable.rating,
        vehicleType: staffTable.vehicleType,
      },
    })
    .from(jobAssignmentsTable)
    .leftJoin(staffTable, eq(jobAssignmentsTable.staffId, staffTable.id))
    .where(tenantId ? eq(jobAssignmentsTable.tenantId, tenantId) : undefined)
    .orderBy(desc(jobAssignmentsTable.assignedAt))
    .limit(200);
  res.json(rows);
});

// PATCH /api/scheduling/assignments/:id/status
router.patch("/scheduling/assignments/:id/status", async (req, res): Promise<void> => {
  const { status } = req.body;
  const valid = ["assigned", "in_progress", "completed", "cancelled"];
  if (!valid.includes(status)) {
    res.status(400).json({ error: `Status must be one of: ${valid.join(", ")}` });
    return;
  }
  const extra: Record<string, Date> = {};
  if (status === "in_progress") extra.startedAt = new Date();
  if (status === "completed")   extra.completedAt = new Date();

  const [row] = await db
    .update(jobAssignmentsTable)
    .set({ status, ...extra } as any)
    .where(eq(jobAssignmentsTable.id, req.params.id))
    .returning();
  if (!row) { res.status(404).json({ error: "Assignment not found" }); return; }
  res.json(row);
});

export default router;
