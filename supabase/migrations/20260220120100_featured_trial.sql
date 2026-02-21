-- Featured trial: grant 7-day featured placement when a seeded listing is claimed.
-- Prevents double-grants via claim_trial_granted flag on listing_claim_requests.
-- Also adds is_featured expiry tracking so featured status turns off automatically.

-- Track whether the claim trial has already been granted for a request
ALTER TABLE listing_claim_requests
  ADD COLUMN IF NOT EXISTS claim_trial_granted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS claim_trial_granted_at TIMESTAMPTZ;

-- Add source column to featured_credits so we can identify trial grants
ALTER TABLE featured_credits
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('referral', 'claim_trial', 'manual', 'purchase'));

-- Add expires_at so the scheduler knows when to turn off is_featured
ALTER TABLE featured_credits
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Function called by the API route when a provider activates their claim trial
CREATE OR REPLACE FUNCTION public.grant_claim_trial(
  p_profile_id   UUID,
  p_listing_id   UUID,
  p_request_id   UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seconds      INTEGER := 604800; -- 7 days
  v_credit_id    UUID;
BEGIN
  -- Verify the claim request belongs to this profile and is approved
  IF NOT EXISTS (
    SELECT 1 FROM listing_claim_requests
    WHERE id = p_request_id
      AND requester_id = p_profile_id
      AND listing_id = p_listing_id
      AND status = 'approved'
      AND claim_trial_granted = false
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Not eligible for claim trial');
  END IF;

  -- Mark trial as granted
  UPDATE listing_claim_requests
  SET claim_trial_granted = true,
      claim_trial_granted_at = now()
  WHERE id = p_request_id;

  -- Grant the featured credit
  INSERT INTO featured_credits (profile_id, seconds_granted, seconds_used, reason, source, expires_at)
  VALUES (p_profile_id, v_seconds, 0, '7-day claim trial', 'claim_trial', now() + INTERVAL '7 days')
  RETURNING id INTO v_credit_id;

  -- Audit log
  INSERT INTO featured_credit_audit_logs
    (profile_id, actor_user_id, action, seconds_delta, reason, metadata)
  VALUES (
    p_profile_id,
    p_profile_id,
    'grant',
    v_seconds,
    'Claim trial activation',
    jsonb_build_object('listing_id', p_listing_id, 'request_id', p_request_id)
  );

  -- Mark the listing as featured
  UPDATE listings SET is_featured = true WHERE id = p_listing_id;

  RETURN jsonb_build_object('ok', true, 'credit_id', v_credit_id, 'seconds', v_seconds);
END;
$$;

-- Scheduled function: expire featured listings whose credits have run out.
-- Called by the GitHub Actions daily cron.
CREATE OR REPLACE FUNCTION public.expire_featured_listings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_expired INTEGER := 0;
BEGIN
  -- Find listings marked as featured but with no remaining credit
  UPDATE listings l
  SET is_featured = false
  WHERE l.is_featured = true
    AND NOT EXISTS (
      SELECT 1
      FROM featured_credits fc
      WHERE fc.profile_id = l.profile_id
        AND fc.expires_at > now()
        AND fc.seconds_used < fc.seconds_granted
    );

  GET DIAGNOSTICS v_expired = ROW_COUNT;
  RETURN v_expired;
END;
$$;
