-- Outreach contacts: one row per provider we are trying to reach.
-- Replaces the CSV tracker files so the daily ops report can auto-populate
-- and claim events can automatically update outreach status.

CREATE TABLE IF NOT EXISTS outreach_contacts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the seeded listing this contact is for
  listing_id            UUID REFERENCES listings(id) ON DELETE SET NULL,

  -- Contact information sourced from the seed data
  display_name          TEXT,
  seed_source_url       TEXT,
  seed_contact_email    TEXT,
  seed_contact_website  TEXT,
  seed_contact_handle   TEXT,

  -- City context for multi-city expansion
  city                  TEXT,
  location_id           UUID REFERENCES locations(id) ON DELETE SET NULL,

  -- Outreach classification (built by build_delivery_queues)
  contact_method        TEXT CHECK (contact_method IN (
                          'email', 'contact_form', 'dm', 'none'
                        )),
  classification_reason TEXT,   -- e.g. 'email_exposed', 'confirmable_form'
  classification_evidence TEXT, -- e.g. 'mailto_found', 'form_message_field_no_captcha'
  classified_at         TIMESTAMPTZ,

  -- Current outreach status
  status                TEXT NOT NULL DEFAULT 'not_contacted' CHECK (status IN (
                          'not_contacted',
                          'delivered_email',
                          'delivered_form',
                          'platform_only',
                          'no_contact_method',
                          'site_down',
                          'needs_manual',
                          'dm_sent',
                          'replied',
                          'claimed',
                          'opted_out'
                        )),

  -- Conversion tracking
  claimed               BOOLEAN NOT NULL DEFAULT false,
  claimed_at            TIMESTAMPTZ,
  featured_trial_started BOOLEAN NOT NULL DEFAULT false,
  featured_trial_started_at TIMESTAMPTZ,

  -- Follow-up sequencing
  last_contacted_at     TIMESTAMPTZ,
  follow_up_count       INTEGER NOT NULL DEFAULT 0,
  next_follow_up_at     TIMESTAMPTZ,

  -- Notes
  notes                 TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_contacts_listing
  ON outreach_contacts(listing_id);
CREATE INDEX IF NOT EXISTS idx_outreach_contacts_status
  ON outreach_contacts(status, last_contacted_at);
CREATE INDEX IF NOT EXISTS idx_outreach_contacts_city_status
  ON outreach_contacts(city, status);
CREATE INDEX IF NOT EXISTS idx_outreach_contacts_follow_up
  ON outreach_contacts(next_follow_up_at)
  WHERE next_follow_up_at IS NOT NULL AND status NOT IN ('claimed', 'opted_out');

-- One attempt record per message sent.
CREATE TABLE IF NOT EXISTS outreach_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      UUID NOT NULL REFERENCES outreach_contacts(id) ON DELETE CASCADE,
  listing_id      UUID REFERENCES listings(id) ON DELETE SET NULL,

  channel         TEXT NOT NULL CHECK (channel IN ('email', 'contact_form', 'dm', 'manual')),
  delivery_url    TEXT,           -- email address or form/page URL used
  delivery_evidence TEXT,         -- 'smtp_sent', 'form_submit_ok', 'platform_domain:onlyfans'
  status          TEXT NOT NULL CHECK (status IN (
                    'sent', 'failed', 'bounced', 'no_success_hint'
                  )),
  template_version TEXT,          -- e.g. 'v1', 'v2_followup_day4'
  error_detail    TEXT,

  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_attempts_contact
  ON outreach_attempts(contact_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_attempts_channel_sent
  ON outreach_attempts(channel, sent_at DESC);

-- Auto-update outreach_contacts.status when a listing gets claimed
-- (profile_id goes from NULL to a real UUID).
CREATE OR REPLACE FUNCTION public.handle_listing_claimed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only fire when profile_id transitions from NULL to a real value
  IF OLD.profile_id IS NULL AND NEW.profile_id IS NOT NULL THEN
    UPDATE outreach_contacts
    SET
      status     = 'claimed',
      claimed    = true,
      claimed_at = now(),
      updated_at = now()
    WHERE listing_id = NEW.id
      AND status NOT IN ('claimed', 'opted_out');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_listing_claimed_update_outreach ON listings;
CREATE TRIGGER on_listing_claimed_update_outreach
AFTER UPDATE OF profile_id ON listings
FOR EACH ROW
EXECUTE FUNCTION public.handle_listing_claimed();

-- RLS: only service_role and admins touch outreach data
ALTER TABLE outreach_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view outreach contacts"
  ON outreach_contacts FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

CREATE POLICY "Service role manages outreach contacts"
  ON outreach_contacts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view outreach attempts"
  ON outreach_attempts FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

CREATE POLICY "Service role manages outreach attempts"
  ON outreach_attempts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
