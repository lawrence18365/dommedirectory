BEGIN;

-- Allow unclaimed listings by making profile ownership nullable.
ALTER TABLE listings
  ALTER COLUMN profile_id DROP NOT NULL;

-- Seeded listing provenance and lifecycle metadata.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS is_seeded BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seed_source_url TEXT,
  ADD COLUMN IF NOT EXISTS seed_source_label TEXT,
  ADD COLUMN IF NOT EXISTS seed_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS seed_contact_website TEXT,
  ADD COLUMN IF NOT EXISTS seed_contact_handle TEXT,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_reason TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listings_seed_requires_source_url'
  ) THEN
    ALTER TABLE listings
      ADD CONSTRAINT listings_seed_requires_source_url
      CHECK (is_seeded = false OR nullif(trim(seed_source_url), '') IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listings_removed_requires_inactive'
  ) THEN
    ALTER TABLE listings
      ADD CONSTRAINT listings_removed_requires_inactive
      CHECK (removed_at IS NULL OR is_active = false);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_listings_seeded_active
  ON listings(is_seeded, is_active, location_id);
CREATE INDEX IF NOT EXISTS idx_listings_seed_contact_email
  ON listings(lower(seed_contact_email))
  WHERE seed_contact_email IS NOT NULL;

-- Keep lead tracking usable for unclaimed listings.
ALTER TABLE lead_events
  ALTER COLUMN profile_id DROP NOT NULL;

ALTER TABLE lead_events
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- Opt-out queue with audit trail.
CREATE TABLE IF NOT EXISTS listing_removal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  requester_email TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution TEXT
);

CREATE INDEX IF NOT EXISTS idx_listing_removal_requests_listing_created
  ON listing_removal_requests(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_removal_requests_resolution
  ON listing_removal_requests(resolution, created_at DESC);

ALTER TABLE listing_removal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit removal requests" ON listing_removal_requests;
CREATE POLICY "Anyone can submit removal requests"
  ON listing_removal_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view removal requests" ON listing_removal_requests;
CREATE POLICY "Admins can view removal requests"
  ON listing_removal_requests
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Service role can manage removal requests" ON listing_removal_requests;
CREATE POLICY "Service role can manage removal requests"
  ON listing_removal_requests
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
