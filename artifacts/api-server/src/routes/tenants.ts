import { Router, type IRouter } from "express";
import { eq, desc, count, and } from "drizzle-orm";
import { db, tenantsTable, bookingsTable, staffTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const PLAN_PRICE: Record<string, number> = { starter: 99, pro: 199, enterprise: 499 };

// GET /api/tenants — list all tenants with stats
router.get("/tenants", async (_req, res): Promise<void> => {
  try {
    const tenants = await db.select().from(tenantsTable).orderBy(desc(tenantsTable.createdAt));

    const enriched = await Promise.all(
      tenants.map(async (t) => {
        const [[{ bookingCount }], [{ staffCount }]] = await Promise.all([
          db.select({ bookingCount: count(bookingsTable.id) })
            .from(bookingsTable)
            .where(eq(bookingsTable.tenantId, t.id)),
          db.select({ staffCount: count(staffTable.id) })
            .from(staffTable)
            .where(eq(staffTable.tenantId, t.id)),
        ]);
        return {
          ...t,
          bookingCount: Number(bookingCount),
          staffCount:   Number(staffCount),
          monthlyPrice: PLAN_PRICE[t.plan] ?? 99,
        };
      }),
    );

    const totalMrr = enriched.reduce((s, t) => s + (t.active ? t.monthlyPrice : 0), 0);
    res.json({ tenants: enriched, totalMrr, totalActive: enriched.filter((t) => t.active).length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

// GET /api/tenants/:slug/branding — public branding endpoint (must come before /:slug)
router.get("/tenants/:slug/branding", async (req, res): Promise<void> => {
  try {
    const [tenant] = await db
      .select({
        name:           tenantsTable.name,
        logo:           tenantsTable.logo,
        primaryColor:   tenantsTable.primaryColor,
        secondaryColor: tenantsTable.secondaryColor,
        slug:           tenantsTable.slug,
      })
      .from(tenantsTable)
      .where(and(eq(tenantsTable.slug, req.params.slug), eq(tenantsTable.active, true)));
    if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
    res.json(tenant);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

// GET /api/tenants/:slug — get tenant by slug
router.get("/tenants/:slug", async (req, res): Promise<void> => {
  try {
    const [tenant] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.slug, req.params.slug));
    if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
    res.json(tenant);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Query failed";
    res.status(500).json({ error: msg });
  }
});

// POST /api/tenants — create tenant
router.post("/tenants", async (req, res): Promise<void> => {
  const b = req.body;
  if (!b.name || !b.slug) {
    res.status(400).json({ error: "name and slug are required" });
    return;
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(b.slug)) {
    res.status(400).json({ error: "Slug must be lowercase alphanumeric with dashes only" });
    return;
  }

  // Validate plan
  const validPlans = ["starter", "pro", "enterprise"];
  if (b.plan && !validPlans.includes(b.plan)) {
    res.status(400).json({ error: `Plan must be one of: ${validPlans.join(", ")}` });
    return;
  }

  try {
    const existing = await db
      .select({ id: tenantsTable.id })
      .from(tenantsTable)
      .where(eq(tenantsTable.slug, b.slug));
    if (existing.length > 0) {
      res.status(409).json({ error: "Slug already taken" });
      return;
    }

    const [row] = await db
      .insert(tenantsTable)
      .values({
        id:             randomUUID(),
        name:           String(b.name).trim(),
        slug:           String(b.slug).trim(),
        domain:         b.domain  ? String(b.domain).trim()  : null,
        logo:           b.logo    ? String(b.logo).trim()    : null,
        primaryColor:   b.primaryColor   ?? "#22d3ee",
        secondaryColor: b.secondaryColor ?? "#0f172a",
        abn:            b.abn    ? String(b.abn).trim()   : null,
        phone:          b.phone  ? String(b.phone).trim() : null,
        email:          b.email  ? String(b.email).trim().toLowerCase() : null,
        plan:           (b.plan as "starter" | "pro" | "enterprise") ?? "starter",
      })
      .returning();
    res.status(201).json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Insert failed";
    res.status(500).json({ error: msg });
  }
});

// PATCH /api/tenants/:id — update tenant
router.patch("/tenants/:id", async (req, res): Promise<void> => {
  const b = req.body;
  const allowed = ["name","domain","logo","primaryColor","secondaryColor","abn","phone","email","plan"] as const;
  const updates: Record<string, unknown> = {};
  for (const k of allowed) { if (k in b) updates[k] = b[k]; }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No valid fields to update" });
    return;
  }

  if (b.plan && !["starter","pro","enterprise"].includes(b.plan)) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  try {
    const [row] = await db
      .update(tenantsTable)
      .set(updates as Partial<typeof tenantsTable.$inferInsert>)
      .where(eq(tenantsTable.id, req.params.id))
      .returning();
    if (!row) { res.status(404).json({ error: "Tenant not found" }); return; }
    res.json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    res.status(500).json({ error: msg });
  }
});

// PATCH /api/tenants/:id/suspend — toggle active
router.patch("/tenants/:id/suspend", async (req, res): Promise<void> => {
  try {
    const [current] = await db
      .select()
      .from(tenantsTable)
      .where(eq(tenantsTable.id, req.params.id));
    if (!current) { res.status(404).json({ error: "Tenant not found" }); return; }
    const [row] = await db
      .update(tenantsTable)
      .set({ active: !current.active })
      .where(eq(tenantsTable.id, req.params.id))
      .returning();
    res.json(row);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Update failed";
    res.status(500).json({ error: msg });
  }
});

export default router;
