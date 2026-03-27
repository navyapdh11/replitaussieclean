import { db, priceRulesTable, priceHistoryTable, dynamicPricingFactorsTable, bookingsTable } from "@workspace/db";
import { eq, and, gte, count } from "drizzle-orm";
import { randomUUID } from "crypto";
import { logger } from "./logger";

export interface PricingContext {
  serviceType: string;
  propertyType?: string;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  suburb?: string;
  state?: string;
  date?: string;
  timeSlot?: string;
}

export interface PricingResult {
  basePriceCents: number;
  dynamicMultiplier: number;
  quoteAmountCents: number;
  gstAmountCents: number;
  totalAmountCents: number;
  currency: string;
  breakdown: {
    base: number;
    demand: number;
    timeSlot: number;
    extras: number;
    weather: number;
    traffic: number;
    staffAvailability: number;
  };
  factorsApplied: {
    demand: number;
    timeSlot: number;
    weather: number;
    traffic: number;
    staffAvailability: number;
  };
  validUntil: string;
}

const FALLBACK_PRICES: Record<string, { base: number; perBed: number; perBath: number }> = {
  standard_clean: { base: 12000, perBed: 2000, perBath: 2500 },
  deep_clean: { base: 18000, perBed: 2500, perBath: 3000 },
  end_of_lease: { base: 26000, perBed: 3000, perBath: 4000 },
  office_clean: { base: 18000, perBed: 1500, perBath: 2000 },
  ndis_support: { base: 15000, perBed: 1800, perBath: 2200 },
};

export async function calculateDynamicPrice(ctx: PricingContext): Promise<PricingResult> {
  const propertyType = ctx.propertyType ?? "house";

  const [priceRule] = await db
    .select()
    .from(priceRulesTable)
    .where(and(eq(priceRulesTable.serviceType, ctx.serviceType), eq(priceRulesTable.propertyType, propertyType), eq(priceRulesTable.active, true)))
    .limit(1);

  const fallback = FALLBACK_PRICES[ctx.serviceType] ?? FALLBACK_PRICES.standard_clean;
  const baseCents = priceRule
    ? priceRule.basePriceCents + ctx.bedrooms * priceRule.perBedroomCents + ctx.bathrooms * priceRule.perBathroomCents
    : fallback.base + ctx.bedrooms * fallback.perBed + ctx.bathrooms * fallback.perBath;

  const addonCents = ctx.extras.length * (priceRule?.addonPriceCents ?? 1500);
  const subBase = baseCents + addonCents;

  const [demandMult, weatherMult, trafficMult, staffMult, adminMult] = await Promise.all([
    calculateDemandMultiplier(ctx),
    Promise.resolve(calculateWeatherMultiplier(ctx)),
    Promise.resolve(calculateTrafficMultiplier(ctx)),
    calculateStaffAvailabilityMultiplier(ctx),
    getAdminPricingMultiplier(),
  ]);
  const timeSlotMult = calculateTimeSlotMultiplier(ctx.timeSlot);

  const rawMultiplier = demandMult * weatherMult * trafficMult * staffMult * timeSlotMult * adminMult;
  const dynamicMultiplier = Math.min(2.0, Math.max(0.8, rawMultiplier));
  const quoteCents = Math.round(subBase * dynamicMultiplier);
  const gstCents = Math.round(quoteCents / 11);
  const totalCents = quoteCents + gstCents;

  const breakdown = {
    base: baseCents,
    extras: addonCents,
    demand: Math.round(subBase * (demandMult - 1)),
    weather: Math.round(subBase * demandMult * (weatherMult - 1)),
    traffic: Math.round(subBase * demandMult * weatherMult * (trafficMult - 1)),
    staffAvailability: Math.round(subBase * demandMult * weatherMult * trafficMult * (staffMult - 1)),
    timeSlot: Math.round(subBase * demandMult * weatherMult * trafficMult * staffMult * (timeSlotMult - 1)),
  };

  try {
    await db.insert(priceHistoryTable).values({
      id: randomUUID(),
      serviceType: ctx.serviceType,
      basePriceCents: subBase,
      finalPriceCents: quoteCents,
      dynamicMultiplier: dynamicMultiplier.toFixed(3),
      factorsApplied: { demand: demandMult, weather: weatherMult, traffic: trafficMult, staffAvailability: staffMult, timeSlot: timeSlotMult, admin: adminMult },
    });
  } catch (err) {
    logger.error("Failed to record price history", { err });
  }

  return {
    basePriceCents: subBase,
    dynamicMultiplier,
    quoteAmountCents: quoteCents,
    gstAmountCents: gstCents,
    totalAmountCents: totalCents,
    currency: "AUD",
    breakdown,
    factorsApplied: { demand: demandMult, timeSlot: timeSlotMult, weather: weatherMult, traffic: trafficMult, staffAvailability: staffMult },
    validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

async function calculateDemandMultiplier(ctx: PricingContext): Promise<number> {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const [result] = await db
      .select({ count: count() })
      .from(priceHistoryTable)
      .where(and(eq(priceHistoryTable.serviceType, ctx.serviceType), gte(priceHistoryTable.createdAt, twoHoursAgo)));
    const n = result?.count ?? 0;
    if (n > 20) return 1.35;
    if (n > 12) return 1.25;
    if (n > 6) return 1.15;
    if (n > 3) return 1.05;
    return 1.0;
  } catch { return 1.0; }
}

function calculateWeatherMultiplier(ctx: PricingContext): number {
  if (!ctx.date || !ctx.state) return 1.0;
  const month = new Date(ctx.date).getMonth();
  const state = ctx.state.toUpperCase();
  if (["VIC", "TAS"].includes(state) && month >= 5 && month <= 8) return 1.12;
  if (["VIC", "TAS"].includes(state) && (month === 4 || month === 9)) return 1.06;
  if (["QLD", "NT", "WA"].includes(state) && (month >= 11 || month <= 2)) return 1.10;
  if (["NSW", "ACT"].includes(state) && (month === 6 || month === 7)) return 1.08;
  if (state === "SA" && (month === 0 || month === 1)) return 1.08;
  return 1.0;
}

function calculateTrafficMultiplier(ctx: PricingContext): number {
  if (!ctx.date) return 1.0;
  const dayOfWeek = new Date(ctx.date).getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return 1.10;
  if (!ctx.timeSlot) return 1.0;
  const rawHour = parseInt(ctx.timeSlot.split(":")[0] ?? "12", 10);
  const lower = ctx.timeSlot.toLowerCase();
  let h = rawHour;
  if (lower.includes("pm") && h !== 12) h += 12;
  if (lower.includes("am") && h === 12) h = 0;
  if ((h >= 7 && h <= 9) || (h >= 16 && h <= 19)) return 1.15;
  return 1.0;
}

async function calculateStaffAvailabilityMultiplier(ctx: PricingContext): Promise<number> {
  if (!ctx.date) return 1.0;
  try {
    const [result] = await db
      .select({ count: count() })
      .from(bookingsTable)
      .where(and(eq(bookingsTable.date, ctx.date), eq(bookingsTable.status, "confirmed")));
    const n = result?.count ?? 0;
    if (n >= 20) return 1.30;
    if (n >= 14) return 1.20;
    if (n >= 8) return 1.10;
    if (n >= 4) return 1.05;
    return 1.0;
  } catch { return 1.0; }
}

function calculateTimeSlotMultiplier(timeSlot?: string): number {
  if (!timeSlot) return 1.0;
  const rawHour = parseInt(timeSlot.split(":")[0] ?? "12", 10);
  const lower = timeSlot.toLowerCase();
  let h = rawHour;
  if (lower.includes("pm") && h !== 12) h += 12;
  if (lower.includes("am") && h === 12) h = 0;
  if (h >= 17) return 1.15;
  if (h < 9) return 1.10;
  return 1.0;
}

async function getAdminPricingMultiplier(): Promise<number> {
  try {
    const now = new Date();
    const activeFactors = await db
      .select()
      .from(dynamicPricingFactorsTable)
      .where(and(eq(dynamicPricingFactorsTable.active, true), gte(dynamicPricingFactorsTable.validUntil, now)));
    if (activeFactors.length === 0) return 1.0;
    return activeFactors.reduce((acc, f) => acc * f.multiplier, 1.0);
  } catch { return 1.0; }
}

export async function getPricingAnalytics() {
  const priceHistory = await db
    .select()
    .from(priceHistoryTable)
    .orderBy(priceHistoryTable.createdAt)
    .limit(50);

  const avgMultiplier = priceHistory.length > 0
    ? priceHistory.reduce((acc, p) => acc + p.finalPriceCents / p.basePriceCents, 0) / priceHistory.length
    : 1.0;

  return { avgMultiplier, priceHistory };
}
