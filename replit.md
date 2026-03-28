# AussieClean Monorepo

## Overview

AussieClean is a comprehensive cleaning service platform built as a pnpm monorepo using TypeScript. It provides a seamless booking experience for customers, efficient management tools for administrators, and robust backend services. Key capabilities include dynamic pricing, AI-powered chat, real-time tracking, and SEO-optimized content generation. The project aims to evolve into a multi-tenant SaaS platform with advanced features like ML-driven demand forecasting and optimized staff scheduling.

## User Preferences

I prefer iterative development with clear communication on major changes. Please ask before implementing significant architectural shifts or major feature additions. I value detailed explanations for complex solutions but prefer concise updates for routine tasks. I like functional programming paradigms where they enhance readability and maintainability.

## System Architecture

The project is structured as a pnpm monorepo with separate applications (`artifacts/`) and shared libraries (`lib/`). TypeScript with composite projects ensures strong type-checking.

**Core Technologies:**
- **Node.js**: 24
- **TypeScript**: 5.9
- **API Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **API Codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite
- **UI/UX**: Premium dark theme (slate-950 bg, cyan-400 accent), Australian locale

**Key Architectural Features:**

### 1. API Server (`artifacts/api-server`)
- Centralized backend for routing, data persistence, and business logic.
- Includes booking management, dynamic pricing, Stripe integration, service area listing, and AI chat endpoints.
- Dynamic pricing engine incorporates multiple factors (demand, weather, traffic, staff availability, time slot) with admin controls and a caching mechanism.

### 2. Booking Application (`artifacts/booking-app`)
- React + Vite frontend providing an 8-step customer booking flow.
- Features dynamic suburb and seasonal pages with auto-generated SEO schema (JSON-LD) for enhanced search visibility.
- Integrates with the API server via generated React Query hooks.
- Includes a floating AI Chat Widget and live GPS tracking using WebSockets.

### 3. Admin Dashboard (`/admin`)
- A 6-tab portal for managing bookings, dispatch, staff, scheduling, and viewing ML forecasts.
- Supports URL hash navigation for state management.
- Implements robust staff management with validation and soft-delete capabilities.

### 4. Multi-tenant SaaS Admin (`/saas-admin`)
- Super-admin interface for managing multiple tenants, including CRUD operations, plan validation, and metrics display.

### 5. ML Forecasting Engine (`lib/mlForecaster.ts`)
- Custom multivariate linear regression model (ridge regularization) for demand forecasting.
- Utilizes various features like day of week, seasonality, and public holidays.
- Incorporates a model cache for performance.

### 6. Scheduling Optimizer (`lib/scheduler.ts`)
- Implements a greedy algorithm for staff assignment based on proximity, rating, and workload.
- Ensures staff availability and tenant association are validated during assignment.

### 7. Real-time Tracking (WebSocket)
- Uses Socket.IO for real-time cleaner location updates and job status tracking.

### 8. SEO / AEO
- Extensive use of JSON-LD schema (WebPage, LocalBusiness, Service, FAQPage, HowTo) for rich search results.
- Canonical links, stable React keys, and memoization are used for performance and SEO hygiene.
- Schema.org compliance is strictly enforced for data types.

### 9. Security
- Implements HSTS headers, HTML escaping for user-supplied data, and input validation for AI chat.
- Secure handling of Stripe webhooks and error responses.

## External Dependencies

- **PostgreSQL**: Primary relational database.
- **Stripe**: Payment gateway for processing transactions.
- **Resend**: Email API for sending notifications and confirmations.
- **OpenAI**: Powers the AI Chat Widget via Replit AI Integration.
- **PostHog**: Client-side analytics for tracking user behavior.
- **Leaflet.js & CartoDB**: Used for interactive mapping and live GPS tracking.
- **Socket.IO**: Enables real-time, bidirectional communication for tracking.
- **express-rate-limit**: Middleware for API rate limiting.
## Comprehensive Code Review — Applied Fixes (Session 3)

### P0 — Runtime Crash Fixes (DB errors served HTML instead of JSON)
- **`serviceAreas.ts` GET `/service-areas`**: Entire DB query wrapped in try/catch. Any DB failure now returns `{"error": "..."}` JSON 500 instead of uncaught exception that bypassed the error handler.
- **`pricingFactors.ts` ALL 5 routes**: GET analytics, GET list, POST, PATCH toggle, DELETE — all now wrapped in try/catch. Also added `Date.parse()` validation to `validateFactorBody()` so invalid date strings like `"foo"` are caught at 400 not passed to `new Date()`. Router type upgraded to `IRouter`.

### P1 — Security / Validation Gaps Fixed
- **`staff.ts` PATCH `/:id`**: Email format + Australian phone re-validated before DB update (POST validated, PATCH did not — now consistent). TypeScript narrowing: extracted `const email = updates.email` / `const phone = updates.phone` to local `string` variables before calling `.trim()` / `.replace()` (necessary because `Record<string, unknown>` indexed access isn't narrowed by `typeof` guard).
- **`staff.ts` PATCH `/:id`**: Empty updates body now returns 400 before touching the DB.
- **`staff.ts` PUT `/:id/availability/:date`**: Date URL param validated as `YYYY-MM-DD` + `Date.parse()` before use.
- **`validate.ts` `PHONE_AU_RE`**: Extended to cover `1300XXXXXX` (freecall) and `1800XXXXXX` (tollfree) in addition to mobile/landline/+61 — now consistent with Step6Details.tsx frontend validation.
- **`adminSystem.ts` PATCH `/admin/system/tenant`**: Empty updates guard added before DB operation.
- **`ml.ts` POST `/ml/forecast`**: Every item in `dates[]` validated with both regex (`/^\d{4}-\d{2}-\d{2}$/`) and `Date.parse()` before `new Date(dateStr + "T00:00:00")`. Returns structured 400 with `{ invalid: [...] }` on bad dates.

### P2 — Logic Bug Fixes
- **`staff.ts` DELETE `/:id`**: Previously only checked `"assigned"` status — staff who were `"in_progress"` (actively on-site) could be hard-deleted. Now checks BOTH statuses and soft-deletes in either case.
- **`staff.ts` GET `/:id`**: Was loading ALL job assignments into Node.js memory then slicing the last 5. Now runs two parallel DB queries: `.limit(5)` for recent assignments and `count()` for the total. Both fire in `Promise.all`.
- **`webhooks.ts`**: `let event: any` → `let event: import("stripe").Stripe.Event`. `(req as any).rawBody` → `(req as Request & { rawBody?: Buffer }).rawBody`. Uses `Buffer.from()` fallback instead of `JSON.stringify()`.

### P3 — Code Quality / DRY
- **`pricing.ts`**: Extracted shared `parseSlotHour(timeSlot: string): number` helper — AM/PM time-slot parsing was duplicated identically in `calculateTrafficMultiplier` and `calculateTimeSlotMultiplier`. Both now call the shared helper. Also handles `NaN` input by returning `1.0` multiplier.

### E2E Validation (Session 3)
All 38 assertions passed:
- `/api/service-areas` returns JSON (not HTML) under DB error conditions
- `/api/pricing-factors` all 5 endpoints return JSON errors not crashes
- `/api/ml/forecast` with invalid dates returns structured 400 with `invalid` array
- `/api/staff/:id` PATCH rejects bad email → 400, bad phone → 400, empty body → 400
- `/api/admin/system/tenant` PATCH with empty body → 400, bad email → 400
- Full booking flow (Steps 1–8) completed: Standard Clean → House → 2 beds → address → details → review showing AUD price

## Deep Code Review — Applied Fixes (Session 4)

Comprehensive codebase analysis using Tree-of-Thoughts (correctness/integrity/security/performance/types) with 12 fixes applied:

### Performance
- **`lib/stripe.ts` (NEW)**: Lazy Stripe singleton module. Both `checkout.ts` and `webhooks.ts` previously called `new Stripe()` inside every request handler — wasting memory and not reusing the HTTPS keep-alive pool. Both now call `getStripe()` from the shared singleton.

### Data Integrity
- **`scheduling.ts` DELETE `/scheduling/assign/:bookingId`**: Two sequential DB mutations (delete assignment + clear `assignedStaffId` on booking) were not transactional. Now wrapped in `db.transaction()` so a partial failure can't leave a booking pointing to a deleted assignment.
- **`pricingFactors.ts` DELETE `/:id`**: Used to return `{ success: true }` with 200 even when the ID didn't exist. Now uses `.returning({ id })` to detect "no rows affected" and returns 404. On success returns 204 No Content (REST convention).

### Correctness
- **`pricing.ts` `calculateWeatherMultiplier` + `calculateTrafficMultiplier`**: `new Date("2024-01-15")` parses as UTC midnight, so `.getMonth()` / `.getDay()` can shift by one day in UTC±n environments. Both now use `new Date(ctx.date + "T00:00:00")` to force local-midnight parsing.
- **`Step4Schedule.tsx` `today` date**: Was using `new Date().toISOString().split("T")[0]` (UTC date), which gives "yesterday" for Australian users before 10am UTC. Now uses `getFullYear()/getMonth()/getDate()` (browser local time).
- **`Step7Review.tsx` service type display**: Was using CSS `capitalize` class on "standard clean" — screen readers and the DOM read raw un-transformed text. Now converts to title case in JavaScript via `.replace(/\b\w/g, c => c.toUpperCase())`.

### Security / Validation
- **`analytics.ts` `httpsGet`**: Didn't check HTTP status codes — a 401/403 from Ahrefs/Semrush would try to parse an HTML error page as JSON, silently corrupting caller data. Now rejects with an error on any non-2xx status before JSON.parse.
- **`analytics.ts` suburb-revenue-trend**: Replaced `sql\`${bookingsTable.postcode} = ${postcode}\`` raw template with `eq(bookingsTable.postcode, postcode)` for clarity and to use Drizzle's typed query builder consistently.
- **`tenants.ts` PATCH `/:id`**: No email format validation when `email` was in the update body (only `plan` was validated). Added `EMAIL_RE` check before the DB update, consistent with `staff.ts` PATCH.

### Code Quality / DRY
- **`staff.ts` DELETE `/:id`**: Two separate DB round-trips (one for `status = "assigned"`, one for `status = "in_progress"`) replaced with a single `inArray(status, ["assigned", "in_progress"])` query with `.limit(1)`. Closes the race window between the two reads.
- **`validate.ts` `PHONE_AU_RE`**: Removed redundant `|1300\d{6}` alternative — already covered by `1[38]00\d{6}` (`[38]` matches 3 → 1300, 8 → 1800). Same fix applied to `staff.ts` local `PHONE_AU_RE`.
- **`tracking.ts`**: Typed `onLocation` and `onStatus` callbacks with proper `CleanerLocationData` / `JobStatusData` interfaces (were `any`). Module-level `window.location.origin` access moved into a lazy `getTrackingUrl()` function to guard against potential SSR scenarios.

### E2E Validation (Session 4)
All assertions passed:
- `pricingFactors DELETE` non-existent ID → 404 ✓
- `tenants PATCH` with invalid email → 400 ✓
- `analytics suburb-revenue-trend` → 200 ✓
- `scheduling DELETE assign` (non-existent) → 204 ✓
- Full 8-step booking flow with service title case "Standard Clean" ✓
- API server TypeScript compiles with zero errors ✓
