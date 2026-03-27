import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, demandForecastsTable } from "@workspace/db";
import { trainDemandModel, forecastDemand, listModelVersions } from "../lib/mlForecaster";

const router: IRouter = Router();

/* Strict ISO date pattern: YYYY-MM-DD */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns true when the string is a valid calendar date in YYYY-MM-DD format */
function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + "T00:00:00");
  return !isNaN(d.getTime());
}

/* ── POST /ml/forecast — generate demand forecast for date range ─────────── */
router.post("/ml/forecast", async (req, res): Promise<void> => {
  const { tenantId, serviceType, dates, suburb, state } = req.body;

  if (!tenantId || !serviceType || !Array.isArray(dates) || dates.length === 0) {
    res.status(400).json({ error: "tenantId, serviceType, and dates[] are required" });
    return;
  }

  if (dates.length > 30) {
    res.status(400).json({ error: "Maximum 30 dates per request" });
    return;
  }

  /* Validate every date string before touching Date() */
  const invalidDates = (dates as unknown[])
    .filter((d) => typeof d !== "string" || !isValidDate(d as string));

  if (invalidDates.length > 0) {
    res.status(400).json({
      error:   "All dates must be valid YYYY-MM-DD calendar strings",
      invalid: invalidDates,
    });
    return;
  }

  try {
    const forecasts = await Promise.all(
      (dates as string[]).map(async (dateStr) => {
        const f = await forecastDemand(
          tenantId,
          serviceType,
          new Date(dateStr + "T00:00:00"),
          suburb,
          state,
        );
        return { date: dateStr, ...f };
      }),
    );
    res.json({ forecasts });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Forecast failed";
    res.status(500).json({ error: msg });
  }
});

/* ── POST /ml/train — train or retrain model ─────────────────────────────── */
router.post("/ml/train", async (req, res): Promise<void> => {
  const { tenantId, serviceType } = req.body;
  if (!tenantId || !serviceType) {
    res.status(400).json({ error: "tenantId and serviceType are required" });
    return;
  }
  try {
    const result = await trainDemandModel(tenantId, serviceType);
    res.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Training failed";
    res.status(500).json({ error: msg });
  }
});

/* ── GET /ml/models — list model versions for a tenant ──────────────────── */
router.get("/ml/models", async (req, res): Promise<void> => {
  const tenantId = req.query.tenantId as string;
  if (!tenantId) {
    res.status(400).json({ error: "tenantId required" });
    return;
  }
  try {
    const versions = await listModelVersions(tenantId);
    res.json(versions);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

/* ── GET /ml/forecast-history — past forecast records ───────────────────── */
router.get("/ml/forecast-history", async (req, res): Promise<void> => {
  const tenantId = req.query.tenantId as string;
  if (!tenantId) {
    res.status(400).json({ error: "tenantId required" });
    return;
  }
  try {
    const rows = await db
      .select()
      .from(demandForecastsTable)
      .where(eq(demandForecastsTable.tenantId, tenantId))
      .orderBy(desc(demandForecastsTable.createdAt))
      .limit(100);
    res.json(rows);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
