BEGIN;

-- Lead tracking table used to prove provider ROI.
CREATE TABLE IF NOT EXISTS lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  visitor_id TEXT,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'listing_view',
      'contact_email_click',
      'contact_phone_click',
      'contact_website_click',
      'contact_booking_click',
      'report_submitted'
    )
  ),
  city_page TEXT,
  page_path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view lead events for own profile" ON lead_events;
CREATE POLICY "Providers can view lead events for own profile"
  ON lead_events
  FOR SELECT
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Service role can insert lead events" ON lead_events;
CREATE POLICY "Service role can insert lead events"
  ON lead_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_lead_events_profile_created_at
  ON lead_events(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_events_listing_created_at
  ON lead_events(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_events_event_type_created_at
  ON lead_events(event_type, created_at DESC);

-- Moderation queue for listing reports.
CREATE TABLE IF NOT EXISTS listing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reported_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  details TEXT,
  source_page TEXT,
  visitor_id TEXT,
  session_id TEXT,
  ip_hash TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed', 'escalated')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view listing reports" ON listing_reports;
CREATE POLICY "Admins can view listing reports"
  ON listing_reports
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Service role can create listing reports" ON listing_reports;
CREATE POLICY "Service role can create listing reports"
  ON listing_reports
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can update listing reports" ON listing_reports;
CREATE POLICY "Admins can update listing reports"
  ON listing_reports
  FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

CREATE INDEX IF NOT EXISTS idx_listing_reports_status_created_at
  ON listing_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_reports_listing_id
  ON listing_reports(listing_id);

-- Verification workflow: explicit tiers + reviewer metadata.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_tier TEXT CHECK (verification_tier IN ('basic', 'pro')),
  ADD COLUMN IF NOT EXISTS response_time_hours INTEGER CHECK (response_time_hours >= 1 AND response_time_hours <= 168),
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE verifications
  ADD COLUMN IF NOT EXISTS tier_requested TEXT CHECK (tier_requested IN ('basic', 'pro')),
  ADD COLUMN IF NOT EXISTS tier_granted TEXT CHECK (tier_granted IN ('basic', 'pro')),
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS verification_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES verifications(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'updated')),
  previous_status TEXT,
  new_status TEXT,
  previous_tier TEXT,
  new_tier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE verification_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view verification audit logs" ON verification_audit_logs;
CREATE POLICY "Admins can view verification audit logs"
  ON verification_audit_logs
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Service role can insert verification audit logs" ON verification_audit_logs;
CREATE POLICY "Service role can insert verification audit logs"
  ON verification_audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_verification_audit_logs_verification
  ON verification_audit_logs(verification_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_audit_logs_profile
  ON verification_audit_logs(profile_id, created_at DESC);

-- Email capture for city update and provider waitlist flows.
CREATE TABLE IF NOT EXISTS email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('city_updates', 'provider_waitlist')),
  city_slug TEXT,
  source_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can insert email subscriptions" ON email_subscriptions;
CREATE POLICY "Service role can insert email subscriptions"
  ON email_subscriptions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can view email subscriptions" ON email_subscriptions;
CREATE POLICY "Admins can view email subscriptions"
  ON email_subscriptions
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Admins can update email subscriptions" ON email_subscriptions;
CREATE POLICY "Admins can update email subscriptions"
  ON email_subscriptions
  FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin')
  WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

CREATE UNIQUE INDEX IF NOT EXISTS uq_email_subscriptions_email_type_city
  ON email_subscriptions (lower(email), subscription_type, coalesce(city_slug, ''));
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_type_city
  ON email_subscriptions(subscription_type, city_slug, created_at DESC);

COMMIT;
