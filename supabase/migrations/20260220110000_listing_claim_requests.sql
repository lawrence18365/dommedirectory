BEGIN;

CREATE TABLE IF NOT EXISTS listing_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_email TEXT,
  proof_method TEXT NOT NULL,
  proof_location TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listing_claim_requests_status_check'
  ) THEN
    ALTER TABLE listing_claim_requests
      ADD CONSTRAINT listing_claim_requests_status_check
      CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listing_claim_requests_method_check'
  ) THEN
    ALTER TABLE listing_claim_requests
      ADD CONSTRAINT listing_claim_requests_method_check
      CHECK (proof_method IN ('website_code', 'source_profile_code'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_listing_claim_requests_listing_status
  ON listing_claim_requests(listing_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_claim_requests_requester
  ON listing_claim_requests(requester_user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_claim_requests_one_pending
  ON listing_claim_requests(listing_id, requester_user_id)
  WHERE status = 'pending';

ALTER TABLE listing_claim_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create claim requests" ON listing_claim_requests;
CREATE POLICY "Users can create claim requests"
  ON listing_claim_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_user_id);

DROP POLICY IF EXISTS "Users can read own claim requests" ON listing_claim_requests;
CREATE POLICY "Users can read own claim requests"
  ON listing_claim_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_user_id);

DROP POLICY IF EXISTS "Admins can view claim requests" ON listing_claim_requests;
CREATE POLICY "Admins can view claim requests"
  ON listing_claim_requests
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Service role can manage claim requests" ON listing_claim_requests;
CREATE POLICY "Service role can manage claim requests"
  ON listing_claim_requests
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
