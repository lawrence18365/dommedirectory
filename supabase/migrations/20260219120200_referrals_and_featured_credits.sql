BEGIN;

-- Provider-shareable referral code.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_share_code TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_referral_share_code_format'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_referral_share_code_format
      CHECK (
        referral_share_code IS NULL
        OR referral_share_code ~ '^[a-z0-9]{6,32}$'
      );
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_referral_share_code
  ON profiles ((lower(referral_share_code)))
  WHERE referral_share_code IS NOT NULL;

-- Backfill deterministic unique codes for existing providers.
UPDATE profiles
SET referral_share_code = lower(replace(id::text, '-', ''))
WHERE referral_share_code IS NULL;

-- Referral attribution events.
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  referrer_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source_city TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attributed_at TIMESTAMPTZ,
  CHECK (referred_profile_id IS NULL OR referred_profile_id <> referrer_profile_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_referrals_referred_profile
  ON referrals(referred_profile_id)
  WHERE referred_profile_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_created
  ON referrals(referrer_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_created
  ON referrals(created_at DESC);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view own referral records" ON referrals;
CREATE POLICY "Providers can view own referral records"
  ON referrals
  FOR SELECT
  USING (
    auth.uid() = referrer_profile_id
    OR auth.uid() = referred_profile_id
  );

DROP POLICY IF EXISTS "Admins can view referrals" ON referrals;
CREATE POLICY "Admins can view referrals"
  ON referrals
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Service role can insert referrals" ON referrals;
CREATE POLICY "Service role can insert referrals"
  ON referrals
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update referrals" ON referrals;
CREATE POLICY "Service role can update referrals"
  ON referrals
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Time-based featured credit ledger.
CREATE TABLE IF NOT EXISTS featured_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  seconds_granted INTEGER NOT NULL CHECK (seconds_granted >= 0),
  seconds_used INTEGER NOT NULL DEFAULT 0 CHECK (seconds_used >= 0),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (seconds_used <= seconds_granted)
);

CREATE INDEX IF NOT EXISTS idx_featured_credits_profile_created
  ON featured_credits(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_featured_credits_city_profile
  ON featured_credits(city_id, profile_id);

ALTER TABLE featured_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view own featured credits" ON featured_credits;
CREATE POLICY "Providers can view own featured credits"
  ON featured_credits
  FOR SELECT
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Admins can view featured credits" ON featured_credits;
CREATE POLICY "Admins can view featured credits"
  ON featured_credits
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Service role can insert featured credits" ON featured_credits;
CREATE POLICY "Service role can insert featured credits"
  ON featured_credits
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update featured credits" ON featured_credits;
CREATE POLICY "Service role can update featured credits"
  ON featured_credits
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Audit log for grant/revoke actions.
CREATE TABLE IF NOT EXISTS featured_credit_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  city_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('grant', 'revoke', 'adjust')),
  seconds_delta INTEGER NOT NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_featured_credit_audit_profile_created
  ON featured_credit_audit_logs(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_featured_credit_audit_actor_created
  ON featured_credit_audit_logs(actor_user_id, created_at DESC);

ALTER TABLE featured_credit_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view featured credit audit logs" ON featured_credit_audit_logs;
CREATE POLICY "Admins can view featured credit audit logs"
  ON featured_credit_audit_logs
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Service role can insert featured credit audit logs" ON featured_credit_audit_logs;
CREATE POLICY "Service role can insert featured credit audit logs"
  ON featured_credit_audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Automatic referral attribution on signup/profile creation.
CREATE OR REPLACE FUNCTION public.apply_referral_reward(new_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_metadata JSONB;
  user_confirmed_at TIMESTAMPTZ;
  referral_event_code TEXT;
  referral_row referrals%ROWTYPE;
  referral_reward_seconds INTEGER := 604800; -- 7 days
BEGIN
  SELECT raw_user_meta_data, email_confirmed_at
  INTO user_metadata, user_confirmed_at
  FROM auth.users
  WHERE id = new_profile_id;

  IF user_metadata IS NULL THEN
    RETURN;
  END IF;

  IF user_confirmed_at IS NULL THEN
    RETURN;
  END IF;

  referral_event_code := nullif(trim(user_metadata ->> 'referral_event_code'), '');
  IF referral_event_code IS NULL THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM referrals
    WHERE referred_profile_id = new_profile_id
  ) THEN
    RETURN;
  END IF;

  SELECT *
  INTO referral_row
  FROM referrals
  WHERE code = referral_event_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF referral_row.referred_profile_id IS NOT NULL THEN
    RETURN;
  END IF;

  IF referral_row.referrer_profile_id = new_profile_id THEN
    RETURN;
  END IF;

  UPDATE referrals
  SET
    referred_profile_id = new_profile_id,
    attributed_at = now(),
    source_city = coalesce(
      nullif(user_metadata ->> 'referral_source_city', ''),
      source_city
    ),
    utm_source = coalesce(
      nullif(user_metadata ->> 'referral_utm_source', ''),
      utm_source
    ),
    utm_medium = coalesce(
      nullif(user_metadata ->> 'referral_utm_medium', ''),
      utm_medium
    ),
    utm_campaign = coalesce(
      nullif(user_metadata ->> 'referral_utm_campaign', ''),
      utm_campaign
    )
  WHERE id = referral_row.id;

  INSERT INTO featured_credits (
    profile_id,
    city_id,
    seconds_granted,
    seconds_used,
    reason
  ) VALUES (
    referral_row.referrer_profile_id,
    NULL,
    referral_reward_seconds,
    0,
    'Referral reward'
  );

  INSERT INTO featured_credit_audit_logs (
    profile_id,
    city_id,
    actor_user_id,
    action,
    seconds_delta,
    reason,
    metadata
  ) VALUES (
    referral_row.referrer_profile_id,
    NULL,
    NULL,
    'grant',
    referral_reward_seconds,
    'Automatic referral reward',
    jsonb_build_object(
      'referral_code', referral_row.code,
      'referred_profile_id', new_profile_id
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_profile_referral_reward()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.apply_referral_reward(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_apply_referral_reward ON profiles;
CREATE TRIGGER on_profile_created_apply_referral_reward
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_referral_reward();

COMMIT;
