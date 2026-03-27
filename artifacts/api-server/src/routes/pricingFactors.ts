import { Router } from "express";
import { db, dynamicPricingFactorsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getPricingAnalytics } from "../lib/pricing";

const router = Router();

function validateFactorBody(body: unknown): { name: string; label: string; multiplier: number; active: boolean; validFrom: string; validUntil: string; metadata: Record<string, unknown> } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.name !== "string" || !b.name.trim()) return null;
  if (typeof b.label !== "string" || !b.label.trim()) return null;
  if (typeof b.multiplier !== "number" || b.multiplier < 0.5 || b.multiplier > 3.0) return null;
  if (typeof b.validFrom !== "string" || typeof b.validUntil !== "string") return null;
  return {
    name: b.name,
    label: b.label,
    multiplier: b.multiplier,
    active: typeof b.active === "boolean" ? b.active : true,
    validFrom: b.validFrom,
    validUntil: b.validUntil,
    metadata: (typeof b.metadata === "object" && b.metadata !== null) ? b.metadata as Record<string, unknown> : {},
  };
}

router.get("/", async (_req, res) => {
  const factors = await db
    .select()
    .from(dynamicPricingFactorsTable)
    .orderBy(desc(dynamicPricingFactorsTable.createdAt));
  res.json(factors);
});

router.post("/", async (req, res) => {
  const data = validateFactorBody(req.body);
  if (!data) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const { name, label, multiplier, active, validFrom, validUntil, metadata } = data;

  const [created] = await db
    .insert(dynamicPricingFactorsTable)
    .values({
      id: randomUUID(),
      name,
      label,
      multiplier,
      active: active ?? true,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      metadata: metadata ?? {},
    })
    .returning();
  res.status(201).json(created);
});

router.patch("/:id/toggle", async (req, res) => {
  const [factor] = await db
    .select()
    .from(dynamicPricingFactorsTable)
    .where(eq(dynamicPricingFactorsTable.id, req.params.id))
    .limit(1);

  if (!factor) { res.status(404).json({ error: "Not found" }); return; }

  const [updated] = await db
    .update(dynamicPricingFactorsTable)
    .set({ active: !factor.active, updatedAt: new Date() })
    .where(eq(dynamicPricingFactorsTable.id, req.params.id))
    .returning();
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  await db
    .delete(dynamicPricingFactorsTable)
    .where(eq(dynamicPricingFactorsTable.id, req.params.id));
  res.json({ success: true });
});

router.get("/analytics", async (_req, res) => {
  const analytics = await getPricingAnalytics();
  res.json(analytics);
});

export { router as pricingFactorsRouter };
