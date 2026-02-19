# Ops Reporting

Daily ops reporting is generated from production data with a locked single-metro scope.

## Primary Metro Lock

The metro lock lives in:

- `docs/ops/primary-metro.json`

Current lock:

- `locationId`: `79ff64ea-9e28-4dff-ba01-4891d0f92114`
- `displayName`: `Toronto, Ontario, Canada`
- `timezone`: `America/Toronto`

## Generate Daily Report

Required environment variables:

- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Command:

```bash
npm run ops:daily-report -- --report_date 2026-02-19 --activity_date 2026-02-18 --outreaches 50 --follow_ups 10
```

Output path:

- `docs/ops/daily/<report_date>.md`

Notes:

- `outreaches` and `follow_ups` are manual inputs until CRM integration exists.
- Other metrics are read from production tables (`listings`, `profiles`, `lead_events`, `listing_reports`, `referral_link_events`).
- Activity windows are computed in the locked metro timezone and converted to UTC for queries.
- In blocked states, report generation still writes the markdown artifact and exits non-zero (`2`):
- `GLOBAL PRE-SUPPLY`: no active listings in production.
- `METRO LOCK EMPTY`: locked metro has no listings.
