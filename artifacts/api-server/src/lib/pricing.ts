import { db, priceRulesTable, priceHistoryTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

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
  };
  factorsApplied: {
    demand: number;
    timeSlot: number;
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
    .where(
      and(
        eq(priceRulesTable.serviceType, ctx.serviceType),
        eq(priceRulesTable.propertyType, propertyType),
        eq(priceRulesTable.active, true)
      )
    )
    .limit(1);

  const fallback = FALLBACK_PRICES[ctx.serviceType] ?? FALLBACK_PRICES.standard_clean;

  const baseCents = priceRule
    ? priceRule.basePriceCents +
      ctx.bedrooms * priceRule.perBedroomCents +
      ctx.bathrooms * priceRule.perBathroomCents
    : fallback.base + ctx.bedrooms * fallback.perBed + ctx.bathrooms * fallback.perBath;

  const addonCents = ctx.extras.length * (priceRule?.addonPriceCents ?? 1500);
  const subBase = baseCents + addonCents;

  const demandMultiplier = await calculateDemandMultiplier(ctx);
  const timeSlotMultiplier = calculateTimeSlotMultiplier(ctx.timeSlot);

  const dynamicMultiplier = Math.min(2.0, demandMultiplier * timeSlotMultiplier);
  const quoteCents = Math.round(subBase * dynamicMultiplier);
  const gstCents = Math.round(quoteCents / 11);
  const totalCents = quoteCents + gstCents;

  await db.insert(priceHistoryTable).values({
    id: randomUUID(),
    serviceType: ctx.serviceType,
    basePriceCents: subBase,
    finalPriceCents: quoteCents,
    dynamicMultiplier: dynamicMultiplier.toFixed(3),
    factorsApplied: { demand: demandMultiplier, timeSlot: timeSlotMultiplier },
  });

  return {
    basePriceCents: subBase,
    dynamicMultiplier,
    quoteAmountCents: quoteCents,
    gstAmountCents: gstCents,
    totalAmountCents: totalCents,
    currency: "AUD",
    breakdown: {
      base: baseCents,
      demand: Math.round(subBase * (demandMultiplier - 1)),
      timeSlot: Math.round(subBase * demandMultiplier * (timeSlotMultiplier - 1)),
      extras: addonCents,
    },
    factorsApplied: {
      demand: demandMultiplier,
      timeSlot: timeSlotMultiplier,
    },
    validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

async function calculateDemandMultiplier(ctx: PricingContext): Promise<number> {
  if (!ctx.suburb || !ctx.date) return 1.0;
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const recentBookings = await db
      .select()
      .from(priceHistoryTable)
      .where(eq(priceHistoryTable.serviceType, ctx.serviceType));

    const recentCount = recentBookings.filter(
      (b) => b.createdAt >= new Date(twoHoursAgo)
    ).length;

    if (recentCount > 15) return 1.30;
    if (recentCount > 10) return 1.25;
    if (recentCount > 5) return 1.15;
    if (recentCount > 2) return 1.05;
    return 1.0;
  } catch {
    return 1.0;
  }
}

function calculateTimeSlotMultiplier(timeSlot?: string): number {
  if (!timeSlot) return 1.0;
  const hour = parseInt(timeSlot.split(":")[0], 10);
  if (hour >= 16) return 1.15;
  if (hour < 10) return 1.10;
  return 1.0;
}
