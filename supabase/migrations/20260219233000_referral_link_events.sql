BEGIN;

CREATE TABLE IF NOT EXISTS referral_link_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_link_events_profile_created
  ON referral_link_events(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_link_events_created
  ON referral_link_events(created_at DESC);

ALTER TABLE referral_link_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view own referral link events" ON referral_link_events;
CREATE POLICY "Providers can view own referral link events"
  ON referral_link_events
  FOR SELECT
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Admins can view referral link events" ON referral_link_events;
CREATE POLICY "Admins can view referral link events"
  ON referral_link_events
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Service role can insert referral link events" ON referral_link_events;
CREATE POLICY "Service role can insert referral link events"
  ON referral_link_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
