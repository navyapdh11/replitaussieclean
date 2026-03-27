import { Router, type IRouter } from "express";

const router: IRouter = Router();

const API_VERSION = "1.0.0";
const BASE = "/api";

/**
 * GET /api/docs
 * Returns a lightweight machine-readable catalogue of all available API routes.
 */
router.get("/docs", (_req, res) => {
  res.json({
    version: API_VERSION,
    title: "AussieClean API",
    description: "Cleaning booking platform — full-stack REST + WebSocket API",
    baseUrl: BASE,
    rateLimits: {
      general: { windowMs: 60_000, max: 120, note: "Applied to all routes" },
      quote:   { windowMs: 60_000, max: 20 },
      booking: { windowMs: 60_000, max: 5  },
      admin:   { windowMs: 60_000, max: 60 },
      chat:    { windowMs: 60_000, max: 30 },
    },
    routes: [
      /* ── Health ─────────────────────────────────────────── */
      {
        method: "GET", path: "/api/healthz",
        description: "Health-check probe. Returns 200 {status:'ok'} when ready.",
        auth: "none", rateLimit: "general",
      },
      {
        method: "GET", path: "/api/docs",
        description: "This API catalogue.",
        auth: "none", rateLimit: "general",
      },

      /* ── Pricing ─────────────────────────────────────────── */
      {
        method: "GET", path: "/api/pricing",
        description: "Calculate a live price quote for a cleaning job.",
        query: ["serviceType", "bedrooms", "bathrooms", "extras", "postcode", "tenantId"],
        auth: "none", rateLimit: "quote",
      },
      {
        method: "GET", path: "/api/pricing-factors",
        description: "List all pricing factor multipliers for a tenant.",
        query: ["tenantId"],
        auth: "none", rateLimit: "general",
      },
      {
        method: "POST", path: "/api/pricing-factors",
        description: "Create a pricing factor multiplier.",
        body: ["tenantId", "factorType", "factorKey", "multiplier", "label"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "PUT", path: "/api/pricing-factors/:id",
        description: "Update a pricing factor multiplier.",
        params: ["id"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "DELETE", path: "/api/pricing-factors/:id",
        description: "Delete a pricing factor multiplier.",
        params: ["id"],
        auth: "admin", rateLimit: "admin",
      },

      /* ── Bookings ────────────────────────────────────────── */
      {
        method: "GET", path: "/api/bookings",
        description: "List bookings. Filter by email, status, tenantId. Paginated (limit/offset).",
        query: ["email", "status", "tenantId", "limit", "offset"],
        auth: "none", rateLimit: "general",
      },
      {
        method: "POST", path: "/api/bookings",
        description: "Create a new booking.",
        body: ["tenantId", "serviceType", "email", "phone", "address", "suburb", "state", "postcode", "bedrooms", "bathrooms", "extras", "preferredDate", "preferredTime", "specialInstructions"],
        auth: "none", rateLimit: "booking",
      },
      {
        method: "GET", path: "/api/bookings/:id",
        description: "Get a single booking by ID.",
        params: ["id"],
        auth: "none", rateLimit: "general",
      },
      {
        method: "PATCH", path: "/api/bookings/:id",
        description: "Update booking status (enforces state-machine transitions).",
        params: ["id"],
        body: ["status"],
        auth: "none", rateLimit: "general",
      },

      /* ── Service Areas ───────────────────────────────────── */
      {
        method: "GET", path: "/api/service-areas",
        description: "List service areas (postcode + state coverage).",
        auth: "none", rateLimit: "general",
      },
      {
        method: "POST", path: "/api/service-areas",
        description: "Add a service area.",
        body: ["postcode", "suburb", "state"],
        auth: "admin", rateLimit: "admin",
      },

      /* ── Checkout / Stripe ───────────────────────────────── */
      {
        method: "POST", path: "/api/checkout",
        description: "Create a Stripe PaymentIntent for a booking.",
        body: ["bookingId", "tenantId"],
        auth: "none", rateLimit: "booking",
      },
      {
        method: "POST", path: "/api/webhooks/stripe",
        description: "Stripe webhook receiver (signature-verified).",
        auth: "stripe-signature", rateLimit: "webhook",
      },

      /* ── AI Chat ─────────────────────────────────────────── */
      {
        method: "POST", path: "/api/ai/chat",
        description: "AI chat assistant (streaming or unary). Powered by OpenAI/Gemini.",
        body: ["messages", "tenantId"],
        auth: "none", rateLimit: "chat",
      },

      /* ── Staff ───────────────────────────────────────────── */
      {
        method: "GET", path: "/api/staff",
        description: "List staff members for a tenant.",
        query: ["tenantId"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "POST", path: "/api/staff",
        description: "Create a staff member. Validates AU phone + email uniqueness per tenant.",
        body: ["tenantId", "name", "email", "phone", "baseSuburb", "baseState", "serviceRadius", "specialisations"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "GET", path: "/api/staff/:id",
        description: "Get a staff member with assignment history.",
        params: ["id"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "PATCH", path: "/api/staff/:id",
        description: "Update a staff member. Soft-deletes if active assignments exist.",
        params: ["id"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "DELETE", path: "/api/staff/:id",
        description: "Delete (or soft-delete) a staff member.",
        params: ["id"],
        auth: "admin", rateLimit: "admin",
      },

      /* ── Scheduling ──────────────────────────────────────── */
      {
        method: "POST", path: "/api/scheduling/optimize",
        description: "Run greedy scheduling optimizer for a given date.",
        body: ["tenantId", "date"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "POST", path: "/api/scheduling/assign",
        description: "Manually assign a staff member to a booking.",
        body: ["tenantId", "bookingId", "staffId"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "GET", path: "/api/scheduling/assignments",
        description: "List job assignments for a tenant and date.",
        query: ["tenantId", "date"],
        auth: "admin", rateLimit: "admin",
      },

      /* ── ML Forecasting ──────────────────────────────────── */
      {
        method: "POST", path: "/api/ml/train",
        description: "Train (or retrain) the demand forecast model for a service type.",
        body: ["tenantId", "serviceType"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "POST", path: "/api/ml/forecast",
        description: "Generate a demand forecast for a service type.",
        body: ["tenantId", "serviceType", "daysAhead"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "GET", path: "/api/ml/models",
        description: "List trained ML models for a tenant.",
        query: ["tenantId"],
        auth: "admin", rateLimit: "admin",
      },

      /* ── Tenants / SaaS ──────────────────────────────────── */
      {
        method: "GET", path: "/api/tenants",
        description: "List all tenants.",
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "POST", path: "/api/tenants",
        description: "Create a new tenant.",
        body: ["name", "slug", "plan", "contactEmail"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "GET", path: "/api/tenants/:slug",
        description: "Get tenant by slug.",
        params: ["slug"],
        auth: "none", rateLimit: "general",
      },
      {
        method: "GET", path: "/api/tenants/:slug/branding",
        description: "Get tenant branding (colours, logo, name).",
        params: ["slug"],
        auth: "none", rateLimit: "general",
      },
      {
        method: "PATCH", path: "/api/tenants/:slug",
        description: "Update tenant settings.",
        params: ["slug"],
        auth: "admin", rateLimit: "admin",
      },

      /* ── Admin System ────────────────────────────────────── */
      {
        method: "GET", path: "/api/admin/system/stats",
        description: "System health: DB latency, record counts, uptime, env info.",
        query: ["tenantId"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "GET", path: "/api/admin/system/tenant",
        description: "Get platform configuration for a tenant.",
        query: ["tenantId"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "PATCH", path: "/api/admin/system/tenant",
        description: "Save platform configuration for a tenant.",
        query: ["tenantId"],
        body: ["name", "contactEmail", "contactPhone", "customDomain", "logoUrl", "primaryColour", "secondaryColour"],
        auth: "admin", rateLimit: "admin",
      },
      {
        method: "POST", path: "/api/admin/system/cache/clear",
        description: "Clear the in-memory pricing multiplier caches.",
        auth: "admin", rateLimit: "admin",
      },

      /* ── Real-time ───────────────────────────────────────── */
      {
        method: "WS", path: "/socket.io",
        description: "Socket.IO WebSocket endpoint for real-time booking status tracking.",
        auth: "none", rateLimit: "none",
      },
    ],
  });
});

export default router;
