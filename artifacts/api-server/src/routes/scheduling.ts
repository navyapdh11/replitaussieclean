import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, jobAssignmentsTable, staffTable, bookingsTable } from "@workspace/db";
import { optimizeSchedule, manualAssign } from "../lib/scheduler";
import { validateBody } from "../middlewares/validate";

const router: IRouter = Router();

// POST /api/scheduling/optimize — run automatic optimization for a date
router.post(
  "/scheduling/optimize",
  validateBody({
    tenantId: { type: "string", required: true, min: 1, max: 128, label: "Tenant ID" },
    date:     { type: "string", required: true, pattern: /^\d{4}-\d{2}-\d{2}$/, label: "Date (YYYY-MM-DD)" },
  }),
  async (req, res): Promise<void> => {
    const { tenantId, date } = req.body as { tenantId: string; date: string };
    try {
      const result = await optimizeSchedule(tenantId, date);
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Optimization failed";
      res.status(500).json({ error: msg });
    }
  },
);

// POST /api/scheduling/assign — manual assignment
router.post(
  "/scheduling/assign",
  validateBody({
    tenantId:  { type: "string", required: true, min: 1, label: "Tenant ID"  },
    bookingId: { type: "string", required: true, min: 1, label: "Booking ID" },
    staffId:   { type: "string", required: true, min: 1, label: "Staff ID"   },
  }),
  async (req, res): Promise<void> => {
    const { tenantId, bookingId, staffId } = req.body as {
      tenantId: string; bookingId: string; staffId: string;
    };
    try {
      const result = await manualAssign(tenantId, bookingId, staffId);
      res.json(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Assignment failed";
      res.status(400).json({ error: msg });
    }
  },
);

// DELETE /api/scheduling/assign/:bookingId — remove assignment
router.delete("/scheduling/assign/:bookingId", async (req, res): Promise<void> => {
  try {
    await db.delete(jobAssignmentsTable).where(eq(jobAssignmentsTable.bookingId, req.params.bookingId));
    await db.update(bookingsTable).set({ assignedStaffId: null }).where(eq(bookingsTable.id, req.params.bookingId));
    res.status(204).send();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Delete failed";
    res.status(500).json({ error: msg });
  }
});

// GET /api/scheduling/assignments
router.get("/scheduling/assignments", async (req, res): Promise<void> => {
  const tenantId = req.query.tenantId as string | undefined;
  try {
    const rows = await db
      .select({
        assignment: jobAssignmentsTable,
        staff: {
          id:          staffTable.id,
          name:        staffTable.name,
          phone:       staffTable.phone,
          rating:      staffTable.rating,
          vehicleType: staffTable.vehicleType,
        },
      })
      .from(jobAssignmentsTable)
      .leftJoin(staffTable, eq(jobAssignmentsTable.staffId, staffTable.id))
      .where(tenantId ? eq(jobAssignmentsTable.tenantId, tenantId) : undefined)
      .orderBy(desc(jobAssignmentsTable.assignedAt))
      .limit(200);
    res.json(rows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

// PATCH /api/scheduling/assignments/:id/status
router.patch("/scheduling/assignments/:id/status", async (req, res): Promise<void> => {
  const { status } = req.body;
  const valid = ["assigned", "in_progress", "completed", "cancelled"];
  if (!valid.includes(status)) {
    res.status(400).json({ error: `Status must be one of: ${valid.join(", ")}` });
    return;
  }

  try {
    const extra: Record<string, Date> = {};
    if (status === "in_progress") extra.startedAt   = new Date();
    if (status === "completed")   extra.completedAt = new Date();

    const [row] = await db
      .update(jobAssignmentsTable)
      .set({ status, ...extra } as Partial<typeof jobAssignmentsTable.$inferInsert>)
      .where(eq(jobAssignmentsTable.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "Assignment not found" }); return; }
    res.json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
