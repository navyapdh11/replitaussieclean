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
- A 6-tab portal for managing bookings, dispatch, staff, scheduling, and viewing ML forecasts.

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

## External Dependencies

- **PostgreSQL**: Primary relational database.
- **Stripe**: Payment gateway for processing transactions.
- **Resend**: Email API for sending notifications and confirmations.
- **OpenAI**: Powers the AI Chat Widget via Replit AI Integration.
- **PostHog**: Client-side analytics for tracking user behavior.
- **Leaflet.js & CartoDB**: Used for interactive mapping and live GPS tracking.
- **Socket.IO**: Enables real-time, bidirectional communication for tracking.
- **express-rate-limit**: Middleware for API rate limiting.