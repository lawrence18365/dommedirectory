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

### 1) Production Supabase migrations (`006`, `007`, `008`)

Status: **PASS**

- Linked project: `mwfybwgkorbyncruzvtm`
- Applied (production): 
  - `20260219120100_leads_and_verification_workflow.sql`
  - `20260219120200_referrals_and_featured_credits.sql`
  - `20260219120300_report_triage_and_notifications.sql`
- Verification checks after apply:
  - Required tables return `200` via PostgREST:
    - `lead_events`, `email_subscriptions`
    - `referrals`, `featured_credits`, `featured_credit_audit_logs`
    - `listing_reports`, `listing_report_audit_logs`, `provider_notifications`
  - Required columns selectable:
    - `profiles`: `verification_tier`, `response_time_hours`, `last_active_at`
    - `verifications`: `tier_requested`, `tier_granted`, `reviewed_by`, `reviewed_at`
  - Trigger behavior validated:
    - Referral capture + referred signup attributed correctly.
    - Referrer received featured credits automatically.
    - City ranking elevated referrer listing with `is_featured_effective=true`.

Gate result: **cleared**

### 2) Environment/secrets correctness (Netlify production)

Status: **PASS**

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

Status: **PASS**

Results:

- Lead funnel:
  - `POST /api/leads/track` -> `201 {"success":true}`
  - `GET /api/leads/export?days=30` (auth token) -> `200` with CSV header
- Referral/flywheel:
  - `GET /api/referrals/link` (auth token) -> `200`
  - `POST /api/referrals/capture` -> `201`
  - `GET /api/location/listings` -> `200`
- Report/triage:
  - `POST /api/reports/listing` -> `201 {"success":true}`
  - `GET /api/admin/reports` (non-admin smoke user) -> `403 {"error":"Forbidden"}` (access control working)

Gate result: **cleared**

### Follow-up (migration hygiene)

- Local repository migration filenames still use non-unique date-only prefixes (`20260209`, `20260217`, `20260219`), while production now has canonical timestamp versions for the three deploy-gate migrations.
- Before the next database rollout, normalize migration versioning to timestamp-unique filenames to avoid CLI history collisions.
