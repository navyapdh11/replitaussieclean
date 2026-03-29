# AussieClean Monorepo

## Overview

AussieClean is a comprehensive cleaning service platform built as a pnpm monorepo using TypeScript. It provides a seamless booking experience for customers, efficient management tools for administrators, and robust backend services. Key capabilities include dynamic pricing, AI-powered chat, real-time tracking, and SEO-optimized content generation. The project aims to evolve into a multi-tenant SaaS platform with advanced features like ML-driven demand forecasting and optimized staff scheduling, with a business vision to capture a significant share of the Australian cleaning market.

## User Preferences

I prefer iterative development with clear communication on major changes. Please ask before implementing significant architectural shifts or major feature additions. I value detailed explanations for complex solutions but prefer concise updates for routine tasks. I like functional programming paradigms where they enhance readability and maintainability.

## System Architecture

The project is structured as a pnpm monorepo with separate applications (`artifacts/`) and shared libraries (`lib/`). TypeScript with composite projects ensures strong type-checking. The UI/UX features a premium dark theme (slate-950 background, cyan-400 accent) and targets the Australian locale.

**Core Technologies:**
- **Node.js**: 24
- **TypeScript**: 5.9
- **API Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **API Codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite
- **UI/UX**: Premium dark theme (slate-950 bg, cyan-400 accent), Australian locale

**Core Architectural Features:**

### 1. API Server (`artifacts/api-server`)
- Centralized backend for routing, data persistence, and business logic, including booking management, dynamic pricing, Stripe integration, service area listing, and AI chat endpoints.
- Features a dynamic pricing engine incorporating multiple factors (demand, weather, traffic, staff availability, time slot) with admin controls and caching.

### 2. Booking Application (`artifacts/booking-app`)
- React + Vite frontend with an 8-step customer booking flow.
- Includes dynamic suburb and seasonal pages with auto-generated SEO schema (JSON-LD) and integrates with the API server via generated React Query hooks.
- Features a floating AI Chat Widget and live GPS tracking using WebSockets.

### 3. Admin Dashboard (`/admin`)
- A 9-tab portal for managing bookings, dispatch, pricing analytics, staff, scheduling, ML forecasts, suburb performance, SEO rankings, and system admin.

### 4. Multi-tenant SaaS Admin (`/saas-admin`)
- Super-admin interface for managing multiple tenants, including CRUD operations, plan validation, and metrics display.

### 5. ML Forecasting Engine (`lib/mlForecaster.ts`)
- Custom multivariate linear regression model for demand forecasting, utilizing features like day of week, seasonality, and public holidays, with a model cache for performance.

### 6. Scheduling Optimizer (`lib/scheduler.ts`)
- Implements a greedy algorithm for staff assignment based on proximity, rating, and workload, ensuring validation of staff availability and tenant association.

### 7. Real-time Tracking
- Uses Socket.IO for real-time cleaner location updates and job status tracking.

### 8. SEO / AEO
- Employs extensive JSON-LD schema (WebPage, LocalBusiness, Service, FAQPage, HowTo) for rich search results, with strict Schema.org compliance.

### 10. Enterprise Spec Compliance (Session 7 — Enterprise Pack)
- **4 Australian compliance pages**: Privacy Policy (Privacy Act 1988 / APPs), Terms & Conditions (ACL-compliant), Accessibility Statement (DDA / WCAG 2.1 AA), Refund & Cancellation Policy
- **Routes**: `/privacy`, `/terms`, `/accessibility`, `/refund-policy` — all wired in `App.tsx`
- **Footer overhauled**: 4-column grid — brand/contact, Services, Company, Legal — with real phone, email, service area coverage, and full legal links
- **POST /api/contact**: enquiry form with AU phone validation, honeypot anti-spam, email notification via Resend
- **POST /api/reviews/request**: triggers after-job review email (validates `completed` status before sending)
- **POST /api/reviews/submit**: accepts star rating + comment, notifies internal team
- **WCAG 2.1 AA — booking funnel overhaul**:
  - Skip-to-main-content link (WCAG 2.4.1) — visible on keyboard focus
  - Progress bar: `role="progressbar"`, `aria-valuenow/min/max`, `aria-label` (WCAG 1.3.1, 4.1.2)
  - Step transitions: programmatic focus management via `headingRef.current.focus()` on step change
  - Error messages: `role="alert"`, `aria-live="assertive"`, `aria-invalid` + `aria-describedby` on errant inputs
  - All required fields: `required`, `aria-required="true"`

### 11. Referral Flywheel & Photo Verification (Session 8)
- **`/referral` page**: Full referral program with email-based unique code generation, WhatsApp/Email/copy-link sharing, 3-step explainer, and credit T&Cs.
- **Enhanced success page**: Post-booking referral prompt with generated code, WhatsApp, Email and copy-link share buttons. Animates in after 400ms.
- **Navbar**: "Refer & Earn" link added to both desktop and mobile menus.
- **PhotoUploadPanel component**: Before/after photo upload with drag-and-drop, file validation, camera capture, lightbox preview, and animated submit state. Shown on booking detail when photo add-on is included or booking is in_progress/completed.
- **AI Prompt Library**: Expanded from 12 to 42 categorised prompts covering social, email, SMS, paid ads, B2B, AI-internal (dispatch, verification, pricing, SEO), retention, support, push, referral, and eco content.

### 9. Security & Code Quality (Session 7)
- HSTS headers, HTML escaping, input validation for AI chat, secure Stripe webhook handling.
- **CORS**: Origin allow-list via `ALLOWED_ORIGINS` env var (falls back to permissive in development).
- **Socket.IO auth**: Cleaner sockets must handshake with `CLEANER_SOCKET_SECRET` before pushing `update_location` / `job_status` events. Customer sockets are read-only (join_job only).
- **Stripe**: Migrated from deprecated `payment_method_types: ["card"]` to `automatic_payment_methods: { enabled: true }`.
- **GST**: Calculated as `quoteCents / 10` (10%, corrected from `/11`).
- **Scheduler**: `optimizeSchedule` insert + update wrapped in `db.transaction()` to prevent orphan assignments.
- **Webhooks**: `checkout.session.expired` pre-checks booking status before cancelling (won't clobber confirmed bookings).
- **Bookings PATCH**: Atomic CAS update (`WHERE id = ? AND status = ?`) prevents SELECT→UPDATE race conditions.
- **AI chat**: `serviceAreas` + `priceRules` cached with 5-minute TTL to avoid a DB round-trip on every chat message.
- **Step 1**: Double-navigation guard (`navigatingRef`) and proper `clearTimeout` on unmount.
- **Step 2**: `useEffect` resets `propertyType` when it's no longer valid for the newly selected service.
- **Step 7**: `fetchQuote` `useCallback` has correct deps (individual store primitives) — no more stale closures.
- **Store**: `TOTAL_STEPS = 8` exported constant replaces the magic number.
- **Analytics**: Dead GSC JWT-building code removed; function throws immediately with a clear message.

### 10. Code Review & Hardening (Session 9)
- **TypeScript zero-errors**: Rebuilt stale `lib/api-client-react` and `lib/api-zod` dist declarations via `tsc --build`; both packages now expose all new fields (`serviceType`, `extrasStr`, `suburb`, `frequency`, `tipAmountCents`) in the `CreateCheckoutSessionRequest` type.
- **Stripe v21 fix**: `checkout.ts` migrated from `automatic_payment_methods: { enabled: true }` (PaymentIntents-only in v21) to `payment_method_types: ["card", "au_becs_debit"]` — the explicit, correct Stripe v21 Checkout Sessions API for Australia.
- **Explicit Zod typing**: Added `type CheckoutBody = z.infer<typeof CreateCheckoutSessionBody>` in `checkout.ts` to ensure TypeScript always sees the full parsed shape regardless of project-reference build state.
- **Rules of Hooks fix (suburb.tsx)**: `useMemo` was being called _after_ an early `if (!data) return` — a React Rules of Hooks violation that would crash on null data. All hooks now execute unconditionally before any early return.
- **FAQ memoization**: `SuburbFaq` now wraps `FAQS_FOR_SUBURB(data)` in `useMemo` to prevent array recreation on every render.
- **Accessibility — aria-hidden on FAQ panels**: Collapsed FAQ panels now carry `aria-hidden={!isOpen}` so screen readers do not traverse hidden answer text.
- **Webhook CAS hardening**: `checkout.session.completed` now uses `inArray(status, ["pending","draft"])` guard — a late Stripe webhook can no longer overwrite a booking that was already cancelled, completed, or refunded by an admin.
- **Webhook security — signature always required**: `stripe-signature` header check now runs _before_ the dev bypass. Missing-header requests receive `400` even when `STRIPE_WEBHOOK_SECRET` is not configured. In production (`NODE_ENV=production`) with no secret, requests receive `503`.
- **Remove `any` casts from Step7Review**: Replaced `serviceType as any` / `propertyType as any` / `onSuccess: (data: any)` with proper `ServiceType`, `PropertyType`, `QuoteResponse`, and `Booking` imports from `@workspace/api-client-react`.
- **Zustand selectors in Step8Payment**: Replaced a full `useBookingStore()` subscription with granular per-field selectors (`useBookingStore((s) => s.field)`) — components no longer re-render on every unrelated state mutation.
- **Step8Payment UX**: Added a full-width "Retry Payment" button (with `RefreshCw` icon) when `createSession.isError` is true; added `aria-busy` on the primary CTA; improved copy ("Redirecting to Stripe…", AU payment method note below button).
- **`payment_intent.payment_failed` CAS**: Webhook also guards the payment-failed revert with the same `MUTABLE_STATUSES` check.

## External Dependencies

- **PostgreSQL**: Primary relational database.
- **Stripe**: Payment gateway for processing transactions.
- **Resend**: Email API for sending notifications and confirmations.
- **OpenAI**: Powers the AI Chat Widget via Replit AI Integration.
- **PostHog**: Client-side analytics for tracking user behavior.
- **Leaflet.js & CartoDB**: Used for interactive mapping and live GPS tracking.
- **Socket.IO**: Enables real-time, bidirectional communication for tracking.
- **express-rate-limit**: Middleware for API rate limiting.