# DommeDirectory

DommeDirectory is a Next.js (Pages Router) application for listing discovery, profiles, reviews, onboarding, and admin verification workflows.

## Stack

- Next.js 16
- React 19
- Supabase (auth + database + optional storage fallback)
- Backblaze B2 (primary media storage)
- Playwright (E2E)
- ESLint + TypeScript

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (for full functionality)

## Installation

```bash
npm ci
```

## Quick Start

1. Create local env file:

```bash
cp .env.example .env.local
```

2. Fill required values in `.env.local`.

3. Start the app:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Use `.env.example` as the source of truth.

Required for full app behavior:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

Required for media upload APIs:

- `B2_ENDPOINT`
- `B2_KEY_ID`
- `B2_APPLICATION_KEY`
- `B2_BUCKET_NAME`
- `NEXT_PUBLIC_B2_PUBLIC_URL`

Required for admin scripts:

- `SUPABASE_SERVICE_ROLE_KEY`

Optional:

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (payments are currently disabled)
- `CHECK_URL` (link checker script)
- `LEAD_EVENT_HASH_SALT` (recommended for hashed event/report IP fingerprints)

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - ESLint
- `npm run lint:fix` - ESLint auto-fix
- `npm run typecheck` - TypeScript checks
- `npm run e2e` - Playwright end-to-end tests
- `npm run gate` - lint + typecheck + build + e2e
- `npm run format` - Prettier write
- `npm run format:check` - Prettier check

## Testing

Run the full local quality gate:

```bash
npm run gate
```

Playwright tests use `playwright.config.ts` and auto-start the app server.

## Supabase Local Development

This repo includes Supabase migrations under `supabase/migrations`.

Typical flow:

```bash
supabase start
supabase db reset
```

Notes:

- `supabase/config.toml` has seeding enabled.
- `supabase/seed.sql` exists as a placeholder and can be expanded with deterministic local data.

## Media Storage

Uploads are handled via API routes:

- `POST /api/media/upload`
- `POST /api/media/delete`

Backblaze B2 is the primary backend. Supabase Storage is only used as a fallback path if needed.

## Lead Tracking & Moderation

This repo includes conversion tracking and moderation endpoints:

- `POST /api/leads/track` (listing views + contact clicks)
- `GET /api/location/listings` (deterministic city ordering: featured credits -> verification -> quality)
- `POST /api/reports/listing` (listing abuse reports)
- `GET|PATCH /api/admin/reports` (moderation triage queue + enforceable actions)
- `GET /api/admin/verifications` (admin verification queue)
- `PATCH /api/admin/verifications` (approve/reject + audit log)
- `POST /api/waitlist/subscribe` (city updates + provider waitlist capture)
- `POST /api/referrals/capture` (capture referral attribution events from landing links)
- `POST /api/referrals/attribute` (apply referral rewards for authenticated signups)
- `GET /api/referrals/link` (provider referral link + referral stats)
- `GET|POST|PATCH /api/admin/featured-credits` (admin grant/revoke + referral/credit data)
- `GET /api/leads/export` (provider CSV export for last 30/90 days)

## Payments

Payments endpoints currently return `410 Gone` intentionally:

- `/api/payments/create-session`
- `/api/payments/create-verification`
- `/api/payments/webhook`

Enable and implement Stripe backend logic before production payment rollout.

## Deployment

Netlify config is in `netlify.toml`.

- Build command: `npm run build`
- Publish directory: `.next`
- Next.js adapter: `@netlify/plugin-nextjs`

## CI

GitHub Actions workflow:

- `.github/workflows/ci.yml`

Pipeline runs:

1. `npm ci`
2. Playwright browser install
3. `lint`
4. `typecheck`
5. `build`
6. `e2e`

## Troubleshooting

- If you see `Missing Supabase environment variables`, verify `.env.local`.
- If the app runs without Supabase config, it will run in degraded mode and skip Supabase-backed data.
- If E2E fails locally, confirm no other process is using port `3000`.

## Deploy Gate Checklist

Last run: 2026-02-19 (US)

### 1) Production Supabase migrations (`20260219_007`, `20260219_008`)

Status: **FAIL (blocked)**

- Could not run `supabase link --project-ref mwfybwgkorbyncruzvtm` from this machine due account privilege error:
  - `Your account does not have the necessary privileges to access this endpoint`
- Direct runtime checks against production PostgREST confirm required tables are missing:
  - `public.referrals`
  - `public.featured_credits`
  - `public.featured_credit_audit_logs`
  - `public.listing_reports`
  - `public.listing_report_audit_logs`
  - `public.provider_notifications`
- Additional dependency gap confirmed: migration `20260219_006_leads_and_verification_workflow.sql` is also not applied in production (missing `lead_events`, `email_subscriptions`, `verification_audit_logs`, and verification tier columns).

Gate result: **not cleared**

### 2) Environment/secrets correctness (Netlify production)

Status: **PASS (with one corrective set)**

- Verified production env includes:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Backblaze keys (`B2_ENDPOINT`, `B2_KEY_ID`, `B2_APPLICATION_KEY`, `B2_BUCKET_NAME`)
- `SUPABASE_URL` was missing and has now been set in production context to match `NEXT_PUBLIC_SUPABASE_URL`.
- Key leak check:
  - Built with production Supabase env values.
  - Searched built artifacts (`.next`) for exact service-role key.
  - Result: `SERVICE_KEY_HITS: 0` (no service key in client bundle).

Gate result: **cleared**

### 3) Production smoke tests (money path + trust path)

Deployment used for test run:

- Netlify deploy id: `69976f5c32b9ac5833958106`
- Preview URL: `https://69976f5c32b9ac5833958106--dommedirectory.netlify.app`
- Production URL: `https://dommedirectory.com`

Status: **FAIL**

Results:

- Lead funnel:
  - `POST /api/leads/track` -> `500 {"error":"Failed to record event"}`
  - `GET /api/leads/export?days=30` -> `500 {"error":"Failed to export lead events"}`
- Referral/flywheel:
  - `GET /api/referrals/link` -> `500 {"error":"Failed to load profile"}`
  - `POST /api/referrals/capture` -> `500 {"error":"Failed to validate referral code"}`
  - `GET /api/location/listings` -> `500 {"error":"Failed to load location listings"}`
- Report/triage:
  - `POST /api/reports/listing` -> `500 {"error":"Failed to submit report"}`
  - `GET /api/admin/reports` (non-admin smoke user) -> `403 {"error":"Forbidden"}` (access control working)

Interpretation:

- Route deployment is now present (no longer 404), but DB schema is behind code expectations, so money-path APIs fail at runtime.

Gate result: **not cleared**

### Required action to clear gate

Apply database migrations in production (in order):

1. `20260219_006_leads_and_verification_workflow.sql`
2. `20260219_007_referrals_and_featured_credits.sql`
3. `20260219_008_report_triage_and_notifications.sql`

After applying, rerun this checklist and all three smoke tracks.
