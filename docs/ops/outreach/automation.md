# Outreach Automation

## Single Source Of Truth
- `OUTREACH_REPLY_TO_EMAIL` is the only sender/reply address used by outreach scripts.
- Current configured inbox: `hello@dommedirectory.com`.

## Cron Jobs (local machine)
- `ddirectory_forward_inbox`: every 10 minutes
  - Forwards unseen inbox emails to `OUTREACH_FORWARD_TO_EMAIL`.
- `ddirectory_build_queues`: daily at 10:05
  - Rebuilds delivery queues from tracker rows still marked `not_contacted`.
- `ddirectory_daily_outreach`: daily at 10:20
  - Runs low-volume outreach using `OUTREACH_DAILY_LIMIT` (default `8`).

## Status Taxonomy
- `delivered_form`
- `delivered_email`
- `platform_only`
- `no_contact_method`
- `site_down`
- `dm_sent`
- `needs_manual`
- `not_contacted`

## Delivery Audit Fields
- `delivery_evidence`
- `delivery_url`

## Queue Files
- `docs/ops/outreach/batch2_email_first.csv`
- `docs/ops/outreach/batch2_forms_confirmable.csv`
- `docs/ops/outreach/dm_queue.csv`
- `docs/ops/outreach/no_contact_method.csv`
- `docs/ops/outreach/batch2_deliverable_30.csv`

## Notes
- Keep outreach volume low until mailbox/domain reputation stabilizes.
- Rotate mailbox credentials after any accidental exposure.
