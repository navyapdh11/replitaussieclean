import { Router, type IRouter } from "express";
import { eq, desc, count, and } from "drizzle-orm";
import { db, tenantsTable, bookingsTable, staffTable } from "@workspace/db";
import { randomUUID } from "crypto";

const router: IRouter = Router();

const PLAN_PRICE: Record<string, number> = { starter: 99, pro: 199, enterprise: 499 };

// GET /api/tenants — list all tenants with stats
router.get("/tenants", async (_req, res): Promise<void> => {
  const tenants = await db.select().from(tenantsTable).orderBy(desc(tenantsTable.createdAt));

  const enriched = await Promise.all(
    tenants.map(async (t) => {
      const [{ bookingCount }] = await db
        .select({ bookingCount: count(bookingsTable.id) })
        .from(bookingsTable)
        .where(eq(bookingsTable.tenantId, t.id));
      const [{ staffCount }] = await db
        .select({ staffCount: count(staffTable.id) })
        .from(staffTable)
        .where(eq(staffTable.tenantId, t.id));
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
});

// GET /api/tenants/:slug/branding — public branding endpoint
router.get("/tenants/:slug/branding", async (req, res): Promise<void> => {
  const [tenant] = await db
    .select({
      name: tenantsTable.name,
      logo: tenantsTable.logo,
      primaryColor:   tenantsTable.primaryColor,
      secondaryColor: tenantsTable.secondaryColor,
      slug: tenantsTable.slug,
    })
    .from(tenantsTable)
    .where(and(eq(tenantsTable.slug, req.params.slug), eq(tenantsTable.active, true)));
  if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
  res.json(tenant);
});

// GET /api/tenants/:slug — get tenant by slug (must come after /tenants/:slug/branding)
router.get("/tenants/:slug", async (req, res): Promise<void> => {
  if (req.params.slug === "branding") return; // guard
  const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, req.params.slug));
  if (!tenant) { res.status(404).json({ error: "Tenant not found" }); return; }
  res.json(tenant);
});

// POST /api/tenants — create tenant
router.post("/tenants", async (req, res): Promise<void> => {
  const b = req.body;
  if (!b.name || !b.slug) { res.status(400).json({ error: "name and slug are required" }); return; }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(b.slug)) {
    res.status(400).json({ error: "Slug must be lowercase alphanumeric with dashes only" });
    return;
  }

  const existing = await db.select({ id: tenantsTable.id }).from(tenantsTable).where(eq(tenantsTable.slug, b.slug));
  if (existing.length > 0) { res.status(409).json({ error: "Slug already taken" }); return; }

  const [row] = await db
    .insert(tenantsTable)
    .values({
      id:             randomUUID(),
      name:           b.name,
      slug:           b.slug,
      domain:         b.domain ?? null,
      logo:           b.logo ?? null,
      primaryColor:   b.primaryColor ?? "#22d3ee",
      secondaryColor: b.secondaryColor ?? "#0f172a",
      abn:            b.abn ?? null,
      phone:          b.phone ?? null,
      email:          b.email ?? null,
      plan:           b.plan ?? "starter",
    })
    .returning();
  res.status(201).json(row);
});

// PATCH /api/tenants/:id — update tenant
router.patch("/tenants/:id", async (req, res): Promise<void> => {
  const b = req.body;
  const allowed = ["name","domain","logo","primaryColor","secondaryColor","abn","phone","email","plan"] as const;
  const updates: Record<string, unknown> = {};
  for (const k of allowed) { if (k in b) updates[k] = b[k]; }

  const [row] = await db
    .update(tenantsTable)
    .set(updates as any)
    .where(eq(tenantsTable.id, req.params.id))
    .returning();
  if (!row) { res.status(404).json({ error: "Tenant not found" }); return; }
  res.json(row);
});

// PATCH /api/tenants/:id/suspend — toggle active
router.patch("/tenants/:id/suspend", async (req, res): Promise<void> => {
  const [current] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, req.params.id));
  if (!current) { res.status(404).json({ error: "Tenant not found" }); return; }
  const [row] = await db
    .update(tenantsTable)
    .set({ active: !current.active })
    .where(eq(tenantsTable.id, req.params.id))
    .returning();
  res.json(row);
});

export default router;
