/**
 * Demand Forecasting Engine
 * ─────────────────────────
 * Uses multivariate linear regression via normal equations:
 *   β = (XᵀX)⁻¹ Xᵀy
 *
 * Feature vector (per training row / prediction):
 *   [dayOfWeek, isWeekend, isPublicHoliday, month, dayOfMonth, serviceIndex]
 *
 * Training data: only confirmed, in_progress, and completed bookings
 * (cancelled/draft bookings don't represent realized demand).
 *
 * When insufficient data (< 5 day-buckets), falls back to day-of-week
 * heuristics so the endpoint always returns a useful prediction.
 */

import { db, bookingsTable, mlModelVersionsTable, demandForecastsTable } from "@workspace/db";
import { eq, and, gte, desc, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logger } from "./logger";

// ── Australian public holidays (month is 1-based) ──────────────────────────
const PUBLIC_HOLIDAYS: Array<{ month: number; day: number }> = [
  { month: 1,  day: 1  }, // New Year's Day
  { month: 1,  day: 26 }, // Australia Day
  { month: 4,  day: 25 }, // ANZAC Day
  { month: 12, day: 25 }, // Christmas Day
  { month: 12, day: 26 }, // Boxing Day
];

/** Tondering's algorithm for Easter Sunday */
function easterDate(year: number): Date {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d2 = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d2 - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function isPublicHoliday(d: Date): boolean {
  const mo = d.getMonth() + 1;
  const da = d.getDate();
  const yr = d.getFullYear();
  const easter = easterDate(yr);
  const gf = new Date(easter); gf.setDate(gf.getDate() - 2);
  const em = new Date(easter); em.setDate(em.getDate() + 1);
  if (d.toDateString() === gf.toDateString() || d.toDateString() === em.toDateString()) return true;
  return PUBLIC_HOLIDAYS.some((h) => h.month === mo && h.day === da);
}

const SERVICE_INDEX: Record<string, number> = {
  standard_clean: 0, deep_clean: 1, end_of_lease: 2,
  office_clean: 3,   carpet_clean: 4,
};

const FEATURE_NAMES = ["dayOfWeek", "isWeekend", "isPublicHoliday", "month", "dayOfMonth", "serviceIndex"];

/** Realized-demand statuses — cancelled/draft bookings do NOT represent demand */
const DEMAND_STATUSES = ["confirmed", "in_progress", "completed"] as const;

function extractFeatures(date: Date, serviceType: string): number[] {
  const dow = date.getDay();
  return [
    dow,
    dow === 0 || dow === 6 ? 1 : 0,   // isWeekend
    isPublicHoliday(date) ? 1 : 0,     // isPublicHoliday
    date.getMonth(),                    // 0–11
    date.getDate(),                     // 1–31
    SERVICE_INDEX[serviceType] ?? 0,
  ];
}

// ── Matrix math (normal equations) ────────────────────────────────────────

type Matrix = number[][];

function transpose(A: Matrix): Matrix {
  return A[0].map((_, j) => A.map((row) => row[j]));
}

function matMul(A: Matrix, B: Matrix): Matrix {
  const m = A.length, n = B[0].length;
  return Array.from({ length: m }, (_, i) =>
    Array.from({ length: n }, (_, j) =>
      A[i].reduce((s, _, l) => s + A[i][l] * B[l][j], 0),
    ),
  );
}

/** Gauss-Jordan elimination with partial pivoting */
function invertMatrix(A: Matrix): Matrix {
  const n = A.length;
  const aug: number[][] = A.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (j === i ? 1 : 0)),
  ]);

  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(aug[r][col]) > Math.abs(aug[maxRow][col])) maxRow = r;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) {
      aug[col][col] = 1e-6; // ridge for singular matrix stability
    }

    const piv = aug[col][col];
    for (let j = 0; j < 2 * n; j++) aug[col][j] /= piv;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = aug[r][col];
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= f * aug[col][j];
    }
  }

  return aug.map((row) => row.slice(n));
}

class MLR {
  private coefs: number[] = [];
  private bias = 0;

  fit(X: Matrix, y: number[]): void {
    // Augment X with bias column
    const Xb = X.map((row) => [1, ...row]);
    const Xt = transpose(Xb);
    const XtX = matMul(Xt, Xb);
    // Ridge regularisation (λ = 0.01) for numerical stability
    const p = XtX.length;
    for (let i = 0; i < p; i++) XtX[i][i] += 0.01;

    const XtXInv = invertMatrix(XtX);
    const Xty = Xt.map((row) => row.reduce((s, v, i) => s + v * y[i], 0));
    const beta = XtXInv.map((row) => row.reduce((s, v, i) => s + v * Xty[i], 0));
    this.bias = beta[0];
    this.coefs = beta.slice(1);
  }

  predict(x: number[]): number {
    return this.bias + x.reduce((s, v, i) => s + v * (this.coefs[i] ?? 0), 0);
  }
}

// ── Day-of-week heuristic fallback ─────────────────────────────────────────
const DOW_DEMAND = [0.6, 0.9, 1.0, 1.1, 1.2, 1.4, 0.8]; // Sun–Sat

// ── In-memory model cache ──────────────────────────────────────────────────
interface CachedModel { model: MLR; version: string; stdDev: number }
const modelCache = new Map<string, CachedModel>();

// ── Public API ─────────────────────────────────────────────────────────────

export interface ForecastResult {
  predictedDemand: number;
  confidenceLow:   number;
  confidenceHigh:  number;
  features:        Record<string, number>;
  modelVersion:    string;
  isHeuristic:     boolean;
}

export async function trainDemandModel(
  tenantId: string,
  serviceType: string,
): Promise<{ version: string; metrics: { mae: number; rmse: number; r2: number }; count: number }> {
  logger.info({ tenantId, serviceType }, "Training demand forecast model");

  const cutoff = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000); // 120 days
  const rows = await db
    .select({ date: bookingsTable.date })
    .from(bookingsTable)
    .where(and(
      ...(tenantId !== "__all__" ? [eq(bookingsTable.tenantId, tenantId)] : []),
      eq(bookingsTable.serviceType, serviceType),
      // Only count realized demand — exclude cancelled/draft/pending
      inArray(bookingsTable.status, [...DEMAND_STATUSES]),
      gte(bookingsTable.createdAt, cutoff),
    ));

  // Aggregate into date → count
  const dayMap = new Map<string, number>();
  rows.forEach((b) => {
    const k = b.date.slice(0, 10);
    dayMap.set(k, (dayMap.get(k) ?? 0) + 1);
  });

  const samples = [...dayMap.entries()].map(([ds, count]) => ({
    x: extractFeatures(new Date(ds + "T00:00:00"), serviceType),
    y: count,
  }));

  const version = `v${Date.now()}`;

  if (samples.length < 5) {
    // Not enough data — skip inserting an unusable model record
    logger.info({ count: samples.length }, "Insufficient data for ML model, using heuristics");
    return { version, metrics: { mae: 0, rmse: 1, r2: 0 }, count: samples.length };
  }

  const model = new MLR();
  model.fit(samples.map((s) => s.x), samples.map((s) => s.y));

  // Compute metrics
  const preds   = samples.map((s) => model.predict(s.x));
  const actuals = samples.map((s) => s.y);
  const errors  = preds.map((p, i) => Math.abs(p - actuals[i]));
  const sqErr   = preds.map((p, i) => (p - actuals[i]) ** 2);
  const mae     = errors.reduce((a, b) => a + b, 0) / errors.length;
  const rmse    = Math.sqrt(sqErr.reduce((a, b) => a + b, 0) / sqErr.length);
  const meanY   = actuals.reduce((a, b) => a + b, 0) / actuals.length;
  const ssTot   = actuals.reduce((a, b) => a + (b - meanY) ** 2, 0);
  const r2      = ssTot === 0 ? 0 : Math.max(0, 1 - sqErr.reduce((a, b) => a + b, 0) / ssTot);
  const metrics = { mae: +mae.toFixed(3), rmse: +rmse.toFixed(3), r2: +r2.toFixed(3) };

  // Deactivate previous active models for this service
  await db.update(mlModelVersionsTable)
    .set({ isActive: false })
    .where(and(
      eq(mlModelVersionsTable.tenantId, tenantId),
      eq(mlModelVersionsTable.name, `demand_${serviceType}`),
    ));

  await db.insert(mlModelVersionsTable).values({
    id: randomUUID(), tenantId,
    name:              `demand_${serviceType}`,
    version,
    metrics,
    trainingDataCount: samples.length,
    featureNames:      FEATURE_NAMES,
    isActive:          true,
  });

  // Update in-memory cache
  modelCache.set(`${tenantId}:${serviceType}`, { model, version, stdDev: rmse });
  logger.info({ version, metrics, count: samples.length }, "Model trained successfully");
  return { version, metrics, count: samples.length };
}

export async function forecastDemand(
  tenantId: string,
  serviceType: string,
  date: Date,
  suburb = "",
  state  = "",
): Promise<ForecastResult> {
  const features = extractFeatures(date, serviceType);
  const featureMap: Record<string, number> = {};
  FEATURE_NAMES.forEach((n, i) => { featureMap[n] = features[i]; });

  // Lazy-load model if not in cache
  const key = `${tenantId}:${serviceType}`;
  if (!modelCache.has(key)) {
    try { await trainDemandModel(tenantId, serviceType); } catch { /* fall through to heuristic */ }
  }

  const cached = modelCache.get(key);
  if (cached) {
    const raw  = cached.model.predict(features);
    const pred = Math.max(0.1, raw);
    const ci   = 1.96 * Math.max(0.5, cached.stdDev);
    const result: ForecastResult = {
      predictedDemand: +pred.toFixed(2),
      confidenceLow:   +Math.max(0, pred - ci).toFixed(2),
      confidenceHigh:  +(pred + ci).toFixed(2),
      features:        featureMap,
      modelVersion:    cached.version,
      isHeuristic:     false,
    };
    void persistForecast(tenantId, serviceType, date, suburb, state, result);
    return result;
  }

  // Pure heuristic fallback
  const base = 3;
  const pred = +(base * DOW_DEMAND[date.getDay()] * (isPublicHoliday(date) ? 0.4 : 1)).toFixed(2);
  const result: ForecastResult = {
    predictedDemand: pred,
    confidenceLow:   +Math.max(0, pred * 0.6).toFixed(2),
    confidenceHigh:  +(pred * 1.4).toFixed(2),
    features:        featureMap,
    modelVersion:    "heuristic_v1",
    isHeuristic:     true,
  };
  void persistForecast(tenantId, serviceType, date, suburb, state, result);
  return result;
}

async function persistForecast(
  tenantId: string, serviceType: string, date: Date,
  suburb: string, state: string, r: ForecastResult,
): Promise<void> {
  try {
    await db.insert(demandForecastsTable).values({
      id:              randomUUID(),
      tenantId,
      suburb,
      state,
      serviceType,
      forecastDate:    date.toISOString().slice(0, 10),
      predictedDemand: r.predictedDemand,
      confidenceLow:   r.confidenceLow,
      confidenceHigh:  r.confidenceHigh,
      features:        r.features,
      modelVersion:    r.modelVersion,
    }).onConflictDoNothing();
  } catch { /* best-effort — forecast persist failures are non-fatal */ }
}

export async function listModelVersions(tenantId: string) {
  return db.select().from(mlModelVersionsTable)
    .where(eq(mlModelVersionsTable.tenantId, tenantId))
    .orderBy(desc(mlModelVersionsTable.trainedAt));
}
