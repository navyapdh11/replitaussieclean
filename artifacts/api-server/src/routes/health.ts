import { Router, type IRouter, type Request, type Response } from "express";
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

/**
 * GET /healthz  and  GET /health
 *
 * Returns 200 when the process is alive AND the database is reachable.
 * Returns 503 when the DB probe fails so load-balancers / readiness probes
 * can route traffic away from unhealthy instances automatically.
 *
 * The probe issues a minimal `SELECT 1` — no table scans, no locks.
 */
async function handler(_req: Request, res: Response): Promise<void> {
  try {
    await db.execute(sql`SELECT 1`);
    res.json(HealthCheckResponse.parse({ status: "ok" }));
  } catch {
    res.status(503).json({ status: "error", detail: "Database unreachable" });
  }
}

router.get("/healthz", handler);
router.get("/health",  handler);

export default router;
