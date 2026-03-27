# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

- `pnpm --filter @workspace/scripts run seed` — Seeds price rules and service areas into the DB

### `artifacts/booking-app` (`@workspace/booking-app`)

React + Vite frontend for the AussieClean booking platform. Premium dark theme (slate-950 bg, cyan-400 accent).

- **8-step booking flow**: Service → Property → Add-ons → Schedule → Address → Details → Review/Quote → Payment
- **State management**: Zustand store (`src/lib/store.ts`) — `BookingState` with all booking fields
- **Pages**: `src/pages/home.tsx`, `src/pages/booking/` (Step1–Step8), `src/pages/dashboard.tsx`, `src/pages/success.tsx`, `src/pages/cancelled.tsx`
- **API integration**: Uses `@workspace/api-client-react` hooks — Step 7 calls `useGetQuote`, Step 8 calls `useCreateCheckoutSession`
- **Australian locale**: AUD currency, 4-digit postcodes, 04XX phone format
- Routes: previewPath `/`, port from `$PORT`

## AussieClean Platform Features

### API Routes (`/api/*`)
- `GET /api/healthz` — Health check
- `GET /api/bookings?email=&status=&limit=&offset=` — List bookings (newest-first, paginated, max 200/page)
- `POST /api/bookings` — Create booking (rate limited: 5/min)
- `GET /api/bookings/:id` — Get booking
- `PATCH /api/bookings/:id` — Update booking status (enforces SERVER_STATUS_TRANSITIONS; 409 on invalid move)
- `POST /api/pricing/quote` — Dynamic pricing quote (rate limited: 20/min)
- `POST /api/checkout/session` — Create Stripe checkout session (or mock URL if no STRIPE_SECRET_KEY)
- `GET /api/service-areas` — List active service areas
- `POST /api/webhooks/stripe` — Stripe webhook handler (verifies signature, confirms/cancels bookings, sends email)
- `POST /api/ai/chat` — AI chat SSE endpoint powered by OpenAI (rate limited: 30/min)
- `GET /api/tracking/:bookingId` — Get current cleaner location for a booking
- `GET /api/pricing-factors` — List all admin surge pricing factors
- `POST /api/pricing-factors` — Create a new surge pricing factor
- `PATCH /api/pricing-factors/:id/toggle` — Toggle a pricing factor active/inactive
- `DELETE /api/pricing-factors/:id` — Delete a pricing factor
- `GET /api/pricing-factors/analytics` — Get pricing analytics (avg multiplier, price history)

### WebSocket (Socket.IO)
- Namespace: `/tracking`
- Events: `join_job` (subscribe), `update_location` (cleaner pushes GPS), `job_status` (status updates)
- Emits: `cleaner_location` (lat/lng/heading/speed), `job_status_update` (status)
- Client lib: `artifacts/booking-app/src/lib/tracking.ts`
- Cleaner hook: `artifacts/booking-app/src/lib/useCleanerTracker.ts` — for cleaner-side GPS broadcasting

### Database Tables
- `bookings` — Full booking records with status, pricing, customer details
- `service_areas` — 18 seeded suburbs across NSW, VIC, QLD, WA, SA, ACT, TAS, NT
- `price_rules` — Per-service/property-type base pricing + per-room rates
- `price_history` — Audit log of all dynamic pricing calculations
- `conversations` — AI chat conversation sessions
- `messages` — AI chat messages (role/content/timestamps)
- `dynamic_pricing_factors` — Admin-controlled surge pricing factors with date range validity

### Dynamic Pricing Engine (`artifacts/api-server/src/lib/pricing.ts`)
- Looks up price rules from DB by serviceType + propertyType
- **5 dynamic multipliers** applied in sequence:
  - **Demand**: based on recent booking volume in past 2 hours (1.0–1.35×)
  - **Weather**: season/state-based Australian climate surcharge (1.0–1.12×)
  - **Traffic**: weekend + peak hour surcharge (1.0–1.15×)
  - **Staff availability**: bookings confirmed for same day (1.0–1.30×)
  - **Time slot**: evening/early-morning premium (1.0–1.15×)
  - **Admin factors**: multiplied from active `dynamic_pricing_factors` DB records
- Total multiplier capped at 0.8×–2.0×
- Returns full breakdown with GST (10%)

### Stripe Integration
- Set `STRIPE_SECRET_KEY` environment variable to enable real Stripe checkout
- Set `STRIPE_WEBHOOK_SECRET` for webhook signature verification
- Without the key, the checkout route returns a mock success URL for development
- Webhook: confirms booking status, sends email confirmation via Resend

### Email Notifications (`artifacts/api-server/src/lib/email.ts`)
- Powered by Resend SDK — set `RESEND_API_KEY` to enable
- Sends HTML booking confirmation email after successful Stripe payment
- Gracefully skips if `RESEND_API_KEY` not set

### AI Chat Widget (`artifacts/booking-app/src/components/AIChatWidget.tsx`)
- Floating cyan button (bottom-right) on every page
- Powered by OpenAI via Replit AI Integration (no API key needed)
- System prompt includes live service areas + pricing from DB
- SSE streaming with word-by-word display
- Starter questions for new conversations

### Analytics (`artifacts/booking-app/src/lib/analytics.ts`)
- PostHog client-side analytics — set `VITE_POSTHOG_KEY` to enable
- Tracks page views, CTA clicks
- Gracefully skips if key not set

### Admin Dashboard (`/admin`)
- Split into focused sub-components under `src/components/admin/`: `BookingsTab`, `DispatchPanel`, `PricingAnalyticsTab`, `StatusBadge`, `QuickStatusSelect`, shared `STATUS_TRANSITIONS` + `patchBookingStatus`
- Full bookings table with stats cards (total, confirmed, pending, revenue); skeleton loaders while fetching
- Filter by status and customer email; bookings sorted newest-first
- **QuickStatusSelect** per row — inline "Move to…" dropdown honouring STATUS_TRANSITIONS
- **Dispatch tab**: card view of all pending/confirmed/in_progress bookings with one-click action buttons
- **Pricing Analytics tab**: avg multiplier stat, surge factor CRUD (create/toggle/delete), price history table
- `bustAdminFactorCache()` called after every pricing factor mutation

### Cleaner Demo Simulation (`artifacts/booking-app/src/lib/tracking.ts`)
- `simulateCleaner(bookingId, lat, lng)` — starts a fake cleaner 3–5 km away and drives it toward the job over ~60 s
- Emits `en_route` status, then real-time `update_location` events with ease-in motion curve, then `arrived` + `in_progress`
- "Demo Mode" button visible on confirmed/in_progress booking detail page — auto-opens map if not already visible

### Booking Detail Page (`/bookings/:id`)
- Shows full booking details: service, schedule, address, contact, payment
- **Live GPS Tracker button** appears for confirmed/in_progress bookings
- Map uses Leaflet + CartoDB dark tiles (lazy-loaded via dynamic import)
- Real-time cleaner position via Socket.IO `/tracking` namespace
- **Haversine ETA calculation**: live "ETA X min" cyan badge shown when status=en_route
- **BoundsController**: auto-fits map to show both cleaner + job markers when location arrives
- Progress bar shows job status (Assigned → En Route → Arrived → Cleaning → Done)
- Status icon panel uses explicit color map (no fragile Tailwind class string manipulation)

### In-Memory Pricing Cache (`artifacts/api-server/src/lib/cache.ts`)
- `TtlCache<T>` — lightweight generic cache with per-key TTL expiry
- `pricingCache`: demand multiplier (15 min TTL), staff availability (10 min TTL)
- `adminFactorCache`: active surge factors composite multiplier (5 min TTL)
- Cache is busted on every pricing factor CRUD mutation via `bustAdminFactorCache()`

### SEO (home.tsx)
- JSON-LD `LocalBusiness` schema with `AggregateRating`, `hasOfferCatalog`, `areaServed`
- Schema includes all 5 states and 5 service types

### Error Boundary
- React `ErrorBoundary` class component wraps entire App
- Shows user-friendly error page with reload button and phone number

### Rate Limiting (`artifacts/api-server/src/lib/ratelimit.ts`)
- Uses `express-rate-limit` v8
- `bookingLimiter`: 5 req/min on POST /bookings
- `quoteLimiter`: 20 req/min on POST /pricing/quote  
- `chatLimiter`: 30 req/min on POST /ai/chat
- `webhookLimiter`: 200 req/min on webhooks
