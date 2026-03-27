/**
 * Admin System routes
 * ──────────────────
 * Provides system health stats, DB record counts, and cache management.
 * All routes are prefixed with /admin/system.
 */

import { Router, type IRouter } from "express";
import { count, eq } from "drizzle-orm";
import {
  db,
  bookingsTable,
  staffTable,
  jobAssignmentsTable,
  mlModelVersionsTable,
  demandForecastsTable,
  tenantsTable,
} from "@workspace/db";
import { pricingCache, adminFactorCache } from "../lib/cache";

const router: IRouter = Router();

// GET /api/admin/system/stats — system health & DB record counts
router.get("/admin/system/stats", async (req, res): Promise<void> => {
  const tenantId = (req.query.tenantId as string) ?? "aussieclean-default";
  const startedAt = Date.now();

  try {
    const [
      [{ bookingCount }],
      [{ staffCount }],
      [{ assignmentCount }],
      [{ modelCount }],
      [{ forecastCount }],
      bookingsByStatus,
    ] = await Promise.all([
      db.select({ bookingCount: count(bookingsTable.id) }).from(bookingsTable),
      db.select({ staffCount: count(staffTable.id) }).from(staffTable).where(eq(staffTable.tenantId, tenantId)),
      db.select({ assignmentCount: count(jobAssignmentsTable.id) }).from(jobAssignmentsTable).where(eq(jobAssignmentsTable.tenantId, tenantId)),
      db.select({ modelCount: count(mlModelVersionsTable.id) }).from(mlModelVersionsTable).where(eq(mlModelVersionsTable.tenantId, tenantId)),
      db.select({ forecastCount: count(demandForecastsTable.id) }).from(demandForecastsTable).where(eq(demandForecastsTable.tenantId, tenantId)),
      db
        .select({ status: bookingsTable.status, cnt: count(bookingsTable.id) })
        .from(bookingsTable)
        .groupBy(bookingsTable.status),
    ]);

    const dbLatencyMs = Date.now() - startedAt;

    res.json({
      status: "healthy",
      dbLatencyMs,
      counts: {
        bookings:    Number(bookingCount),
        staff:       Number(staffCount),
        assignments: Number(assignmentCount),
        mlModels:    Number(modelCount),
        forecasts:   Number(forecastCount),
      },
      bookingsByStatus: Object.fromEntries(
        bookingsByStatus.map(({ status, cnt }) => [status, Number(cnt)]),
      ),
      cache: {
        pricingEntries:      pricingCache.size(),
        adminFactorEntries:  adminFactorCache.size(),
      },
      nodeEnv:    process.env["NODE_ENV"] ?? "unknown",
      nodeVersion: process.version,
      uptime:     Math.floor(process.uptime()),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Stats query failed";
    res.status(500).json({ status: "error", error: msg });
  }
});

// POST /api/admin/system/cache/clear — clear pricing and factor caches
router.post("/admin/system/cache/clear", async (_req, res): Promise<void> => {
  try {
    pricingCache.clear();
    adminFactorCache.clear();
    res.json({ success: true, message: "Pricing caches cleared successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Cache clear failed";
    res.status(500).json({ error: msg });
  }
});

// GET /api/admin/system/tenant — read tenant config
router.get("/admin/system/tenant", async (req, res): Promise<void> => {
  const tenantId = (req.query.tenantId as string) ?? "aussieclean-default";
  try {
    const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId));
    if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
    res.json(tenant);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

// PATCH /api/admin/system/tenant — update tenant settings
router.patch("/admin/system/tenant", async (req, res): Promise<void> => {
  const tenantId = (req.query.tenantId as string) ?? "aussieclean-default";
  const b = req.body;
  const allowed = ["name", "email", "phone", "abn", "primaryColor", "secondaryColor", "logo", "domain"] as const;
  const updates: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in b && b[k] !== undefined) updates[k] = b[k];
  }

  if (typeof updates.email === "string" && updates.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.email as string)) {
      res.status(400).json({ error: "Invalid email address" });
      return;
    }
  }

  try {
    const [row] = await db
      .update(tenantsTable)
      .set(updates as Partial<typeof tenantsTable.$inferInsert>)
      .where(eq(tenantsTable.id, tenantId))
      .returning();
    if (!row) { res.status(404).json({ error: "Tenant not found" }); return; }
    res.json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
