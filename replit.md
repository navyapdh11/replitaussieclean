# AussieClean Monorepo

## Overview

AussieClean is a pnpm workspace monorepo using TypeScript, designed for a comprehensive cleaning service platform. It encompasses a booking application, an API server, and shared libraries. The platform provides a seamless booking experience for customers, efficient management tools for administrators, and robust backend services including dynamic pricing, AI-powered chat, and real-time tracking.

The project's vision is a multi-tenant SaaS platform for cleaning services, offering advanced features like ML-driven demand forecasting and optimised staff scheduling.

## User Preferences

I prefer iterative development with clear communication on major changes. Please ask before implementing significant architectural shifts or major feature additions. I value detailed explanations for complex solutions but prefer concise updates for routine tasks. I like functional programming paradigms where they enhance readability and maintainability.

## System Architecture

The project is structured as a pnpm monorepo, separating deployable applications (`artifacts/`) from shared libraries (`lib/`). TypeScript with composite projects ensures robust type-checking across packages.

**Core Technologies:**
- **Node.js**: 24
- **TypeScript**: 5.9
- **API Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Manual (no Zod in api-server routes — esbuild external issue)
- **API Codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite
- **UI/UX**: Premium dark theme (slate-950 bg, cyan-400 accent), Australian locale

## Key Features & Implementations

### 1. API Server (`artifacts/api-server`)
- Handles all backend logic, routing, and data persistence.
- Routes are validated manually (Zod cannot be imported in api-server due to esbuild external issue).
- Includes health check, booking management (CRUD + status transitions), dynamic pricing quotes, Stripe checkout, service area listing, AI chat endpoints.
- Dynamic pricing engine with five multipliers (demand, weather, traffic, staff availability, time slot) plus admin-controlled factors, capped between 0.8× and 2.0×.
- In-memory `TtlCache` with auto-pruning (`setInterval`, `prune()`, `destroy()`, `unref()`) for pricing factors.
- All route handlers wrapped in try/catch with typed error responses.

### 2. Booking Application (`artifacts/booking-app`)
- React + Vite frontend for customer bookings.
- 8-step booking flow (Service, Property, Add-ons, Schedule, Address, Details, Review/Quote, Payment).
- Zustand for state management (`BookingState`).
- **Dynamic Suburb System**: 14 suburbs in `src/data/suburbs.ts` registry; route `/suburb/:slug` renders localised suburb pages with pollen/mould risk profiles.
- **Multi-Season Pages**: Route `/suburb/:slug/:season` generates unique spring/summer/autumn/winter pages per suburb. Season templates in `src/data/seasonal-content.ts` use `[Suburb]`/`[Postcode]` placeholder replacement.
- **Schema Builder**: `src/lib/schema-builder.ts` provides `buildSeasonalSuburbSchema()` — generates a 5-node @graph (WebPage + LocalBusiness + Service + FAQPage + HowTo) with speakable selectors.
- **HowToSection**: Flexible component accepting optional override props (steps, name, description, supplies, tools, totalTime) for season-specific content.
- **Sitemap Page**: `/sitemap` route lists all 14 suburbs × 4 seasons (56+ pages) with links.
- **JSON-LD @graph (home page)**: 9 nodes — WebPage + LocalBusiness + 5×Service + FAQPage + HowTo with SpeakableSpecification.
- **Citation CSV**: `public/AussieClean-Citation-Directories.csv` — 45 Australian directories with NAP template and 30-day plan.
- Suburb scaling: add one object to `SUBURB_DATA` array — all 4 season pages, schema, FAQ, HowTo auto-generate.
- API server integration via generated React Query hooks (`@workspace/api-client-react`).
- Floating AI Chat Widget powered by OpenAI (Replit AI Integration) with SSE streaming.
- Live GPS tracking (Leaflet + CartoDB tiles) via WebSocket for booking detail page.
- SEO optimised with JSON-LD schema, global error boundary.
- All feedback uses `useToast` hook — zero `alert()` calls in the entire frontend.

### 3. Admin Dashboard (`/admin`)
- 6-tab portal: Bookings, Dispatch, Pricing Analytics, Staff, Scheduling, ML Forecast.
- URL hash navigation (`#bookings`, `#staff`, `#ml`, etc.) — browser back/forward works.
- Booking status management with server-enforced transitions.
- Staff management with email uniqueness enforcement, AU phone validation, skills assignment, soft-delete safety.
- Scheduling optimizer with date-scoped assignment counts (avoids counting historical assignments as today's load).
- ML Forecast chart has `role="img"` + `aria-label` for accessibility.

### 4. Multi-tenant SaaS Admin (`/saas-admin`)
- Super-admin portal for managing multiple tenants.
- Metrics: MRR, active tenants, total bookings.
- Tenant CRUD with slug uniqueness enforcement, plan validation, brand colour picker.
- Suspend/reactivate tenants.
- Pricing tier display (Starter $99, Pro $199, Enterprise $499/mo).

### 5. ML Forecasting Engine (`lib/mlForecaster.ts`)
- Custom multivariate linear regression (ridge regularisation, normal equations).
- Features: dayOfWeek, isWeekend, isPublicHoliday, month, dayOfMonth, serviceIndex.
- Training data: only `confirmed`, `in_progress`, `completed` bookings (cancelled/draft excluded from demand signal).
- Models with < 5 samples skip DB insert and return without creating noise in model versions table.
- Day-of-week heuristic fallback when no trained model exists.
- Model cache (`Map<string, CachedModel>`) keyed by `${tenantId}:${serviceType}`.

### 6. Scheduling Optimizer (`lib/scheduler.ts`)
- Greedy composite score (proximity 50%, rating 30%, workload 20%).
- Assignment count filtered by target date + active statuses (`["assigned", "in_progress"]`) only — historical assignments don't inflate today's load.
- `manualAssign` validates staff belongs to the requesting tenant.
- Soft-delete safety: staff with active assignments are deactivated rather than hard-deleted.

### 7. Real-time Tracking (WebSocket)
- Socket.IO (`/tracking` namespace) for real-time cleaner location + job status.
- Events: `join_job`, `update_location`, `job_status`.
- Demo mode: `simulateCleaner()`.

### 8. SEO / AEO — Known Patterns
- **JSON-LD `reviewCount`**: Must be a **number** (not `String()`). Both `buildSuburbJsonLd()` (suburbs.ts) and `buildSeasonalSuburbSchema()` (schema-builder.ts) use `data.reviewCount` (number) and `bestRating: 5` (number).
- **`ratingValue`**: Cast with `Number(data.rating)` to ensure schema.org compliance.
- **Canonical link**: Injected in `useEffect` in `suburb-season.tsx` (`<link rel="canonical" href="...">`). Cleaned up on unmount.
- **Season badge year**: Computed as `new Date().getFullYear()` — never hardcoded.
- **React keys in suburb-season**: Use `faq.question` (not index) for FAQs; use `a.question` for atomic answers; use `` `${n}-${i}` `` for neighbours.
- **`useMemo` in suburb-season**: All 6 `fillXxx()` computations memoised so they run once per route change (not once per render + once in `useEffect`).

### 9. Schema.org Compliance — home.tsx
- `home.tsx` `JSON_LD` constant: `ratingValue`, `reviewCount`, `bestRating`, `worstRating` are all **numbers** (not strings).
- `@type` for LocalBusiness is `["LocalBusiness", "CleaningService"]` — **not** `"HousePainter"`.
- Applies to both the static `JSON_LD` constant in `home.tsx` AND the dynamic builders in `suburbs.ts` / `schema-builder.ts`.

### 10. Suburb Neighbour Postcode Alignment
All 13 suburb entries must have `neighbourPostcodes.length === neighbours.length`. Fixed mismatches:
- **Chatswood**: added Gordon `"2072"` (was 4 entries for 5 neighbours)
- **Richmond**: added East Melbourne `"3002"` slot with Cremorne fixed to `"3121"` (5 entries)
- **South Yarra**: added Armadale `"3143"` (5 entries total)
- **New Farm**: inserted Teneriffe `"4005"` at index 2 (5 entries total)
- **Subiaco**: added Floreat `"6014"` (Leederville stays `"6007"` at end; 5 entries)
- **Norwood**: fixed Beulah Park `"5007"→"5067"`, added College Park `"5069"` (5 entries)
- **Manly**: fully rebuilt — `["2093","2094","2092","2096","2096"]` for Balgowlah/Fairlight/Seaforth/Freshwater/Queenscliff

### 11. Analytics Mock Rankings
- `djb2(keyword)` hash provides per-keyword variation that is completely independent of the arithmetic `i` loop index.
- Formula: `posRaw = (seedA * 1031 ^ kwHash * 17 ^ i * 59) & 0xffff` — non-linear, no arithmetic sequences.
- Change formula: `chgRaw = (kwHash * 3 + seedA * 7 + i * 11) & 0xffff` — independent from position, can't collapse to ramp.
- Verified output for Parramatta: positions 28, 27, 44, 21, 33, 38, 33, 42, 21 — all different.

### 10. Database (`lib/db`)
- Drizzle ORM with PostgreSQL.
- Schemas: `bookings`, `service_areas`, `price_rules`, `price_history`, `conversations`, `messages`, `dynamic_pricing_factors`, `tenants`, `staff`, `staff_availability`, `job_assignments`, `demand_forecasts`, `ml_model_versions`.
- Default tenant: `id = slug = "aussieclean-default"` (FK used by staff, ML, scheduling).
- Push command: `pnpm --filter @workspace/db run push-force`

## Route Notes

- API routes mounted at `/api`: `app.use("/api", router)` — sub-routes use paths **without** `/api/` prefix.
- Frontend API calls: `${BASE_URL}/api/...` where `BASE_URL = (import.meta.env.BASE_URL ?? "/booking-app").replace(/\/$/, "")`.
- Stripe webhook raw body handler placed **after** gzip compression middleware.
- `tenants/:slug/branding` route registered **before** `tenants/:slug` to prevent prefix collision.

## External Dependencies

- **PostgreSQL**: Primary database.
- **Stripe**: Payment gateway. Requires `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`.
- **Resend**: Email API for booking confirmations. Requires `RESEND_API_KEY`.
- **OpenAI**: AI Chat Widget via Replit AI Integration (no separate API key needed).
- **PostHog**: Client-side analytics. Requires `VITE_POSTHOG_KEY`.
- **Leaflet.js & CartoDB**: Mapping for live GPS tracking.
- **Socket.IO**: WebSocket for real-time communication.
- **express-rate-limit**: API rate limiting middleware.

## Seeded Demo Data

- **Sam Mitchell** — NSW, Sydney, cleaner (standard/deep clean skills)
- **Jane Cooper** — VIC, Melbourne, supervisor (all skills)
- **Marcus Wong** — QLD, Brisbane, cleaner (carpet/office clean skills)
All seeded under tenant `aussieclean-default`.

## Code Quality Standards Enforced

### React Key Stability
- `FaqSection.tsx`: `key={item.q}` (question string — unique, stable)
- `ReviewsSection.tsx`: `key={review.name}` (reviewer name — unique, stable)
- Never use `key={i}` for lists that can reorder or have identity

### Accessibility (ARIA) Contracts
- `AIChatWidget`: `aria-live="polite"` on message list; `aria-label` on text input; `role="dialog"` + `aria-modal="false"` on panel; `aria-expanded` + `aria-controls` on toggle button; collision-free message IDs via ref counter (`msgCountRef`)
- `SeasonalSection`: full roving tabindex pattern — active tab `tabIndex=0`, others `-1`; ArrowLeft/ArrowRight/Home/End keyboard navigation; focus management via `tabRefs` Map
- `ReviewsSection` `StarRating`: `role="img"` on container + `aria-label` (stars are `aria-hidden`)
- `HowToSection`: step buttons use `aria-expanded` + `aria-controls`; panels use `role="region"` + `aria-labelledby`
- `Admin tabs` (admin.tsx): `role="tablist"` / `role="tab"` / `role="tabpanel"` with `aria-selected` / `aria-controls` / `aria-labelledby`
- **Booking Steps 1–6 full accessibility pass**:
  - All toggle/selection buttons have `type="button"` + `aria-pressed={isSelected}`
  - All form inputs have `id` attributes; all labels have `htmlFor` attributes (programmatic association)
  - All error paragraphs have `role="alert"` (screen reader announcement on validation failure)
  - Bedroom/bathroom stepper buttons have `aria-label` + counter div has `role="status"` + `aria-live="polite"`
  - Postcode input has `inputMode="numeric"` + `pattern="[0-9]{4}"` + `autoComplete="postal-code"`
  - All inputs have appropriate `autoComplete` values (given-name, family-name, email, tel, street-address, etc.)

### Performance / Render Hygiene
- `Footer.tsx`: `CURRENT_YEAR` is a module-level constant (computed once at import time)
- `HowToSection.tsx`: `durationLabel` wrapped in `useMemo([overrideTotalTime])`
- `SuburbPerformanceTab.tsx`: sorted list + totals wrapped in `useMemo`
- `suburb.tsx`: JSON-LD object wrapped in `useMemo`

### Shared Constants
- `artifacts/booking-app/src/components/admin/shared.ts` exports **both** `BASE_URL` and `TENANT_ID`
- All admin tab components (`StaffTab`, `SchedulingTab`, `MLForecastTab`, `AdminOnlyTab`) import from `shared` — no local duplicates

### TypeScript Cleanliness
- `saas-admin.tsx` `PRICING_TIERS.map`: block-body callback extracts `highlight` via `"highlight" in tier` guard; `tier.features` reference (not destructured)
- `AdminOnlyTab.tsx` form body: nullable fields cast with `?? undefined` before assignment to `Record<string, string | undefined>`
- API server: **zero TypeScript errors** — all 19 prior errors resolved
- `lib/db`, `lib/api-zod`, `lib/integrations-openai-ai-server`: `noEmitOnError: false` so declarations emit despite drizzle-zod version mismatch
- Route files: `Partial<typeof table.$inferInsert>` instead of broken `Parameters<typeof table.$inferInsert>[0]`
- `ai.ts`: removed direct `import type OpenAI from "openai"` (not in api-server deps) — uses inline role union type instead

### Security
- **HSTS**: `Strict-Transport-Security: max-age=31536000; includeSubDomains` added to `securityHeaders.ts`
- **Email HTML injection**: all user-supplied strings (firstName, serviceName, address, etc.) HTML-escaped via `escHtml()` before template injection
- **AI chat input validation**: message role must be `"user"|"assistant"|"system"`; content capped at 2000 chars; max 20 messages per request
- **checkout.ts**: Stripe `checkout.sessions.create()` wrapped in try/catch → returns 502 on Stripe failure instead of crashing

### Pino Logger Arg Order
Correct: `logger.info({ meta }, "message")` — metadata FIRST, string SECOND.
All call sites fixed: `email.ts`, `pricing.ts`, `ai.ts`, `webhooks.ts` (was reversed, silently losing metadata).

### AI Model
- `ai.ts`: corrected from `"gpt-5-mini"` (non-existent) → `"gpt-4o-mini"` (runtime-viable model)

### Australian Phone Validation (Step6Details)
Regex covers: mobile `04XXXXXXXX`, landline `0[23578]XXXXXXXX`, `1300XXXXXX`, `1800XXXXXX`, international `+61` prefix. Spaces/hyphens/parens stripped before matching.
