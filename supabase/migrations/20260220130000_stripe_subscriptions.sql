-- ============================================================
-- DommeDirectory — Stripe Subscriptions Migration
-- Description: Adds revenue tracking fields to profiles
-- ============================================================

-- Add Stripe tracking fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS premium_tier TEXT DEFAULT 'basic';

-- Create an index to quickly look up users by their Stripe Customer ID (useful for webhooks)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- Expose these fields securely. The user should be able to SELECT their own 
-- subscription status, but they CANNOT UPDATE it directly.
-- The RLS policies already established handle standard SELECT/UPDATE on profiles,
-- but we should ensure the user cannot spoof their premium_tier from the frontend.

-- We don't want the user sending `premium_tier: 'elite'` via the client Supabase JS.
-- However, standard Row Level Security UPDATE policies usually don't restrict *which* columns
-- a user can update unless we write a specific trigger or revoke UPDATE on that column.
-- Since the service_role key bypasses RLS, we can restrict updates via a trigger:

CREATE OR REPLACE FUNCTION prevent_stripe_spoofing()
RETURNS TRIGGER AS $$
BEGIN
  -- If the update is coming from the authenticated user (not service_role),
  -- they should not be allowed to change their own premium_tier or stripe fields.
  IF auth.role() = 'authenticated' THEN
    IF NEW.premium_tier IS DISTINCT FROM OLD.premium_tier OR
       NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id OR
       NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id OR
       NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
      RAISE EXCEPTION 'You cannot modify billing fields directly.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_stripe_spoofing ON profiles;
CREATE TRIGGER trg_prevent_stripe_spoofing
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_stripe_spoofing();
