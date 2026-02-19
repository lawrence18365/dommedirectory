BEGIN;

-- Audit log for report-triage actions.
CREATE TABLE IF NOT EXISTS listing_report_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES listing_reports(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (
    action IN (
      'resolve',
      'reject',
      'request_changes',
      'soft_hide',
      'escalate_verification'
    )
  ),
  previous_status TEXT,
  new_status TEXT,
  previous_listing_active BOOLEAN,
  new_listing_active BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_report_audit_logs_report_created
  ON listing_report_audit_logs(report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_report_audit_logs_listing_created
  ON listing_report_audit_logs(listing_id, created_at DESC);

ALTER TABLE listing_report_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view report audit logs" ON listing_report_audit_logs;
CREATE POLICY "Admins can view report audit logs"
  ON listing_report_audit_logs
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Service role can insert report audit logs" ON listing_report_audit_logs;
CREATE POLICY "Service role can insert report audit logs"
  ON listing_report_audit_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Provider notification outbox (email/send pipeline can consume later).
CREATE TABLE IF NOT EXISTS provider_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'report_resolved',
      'report_rejected',
      'report_request_changes',
      'report_soft_hidden',
      'report_escalated_verification'
    )
  ),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_provider_notifications_profile_status_created
  ON provider_notifications(profile_id, status, created_at DESC);

ALTER TABLE provider_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Providers can view own notifications" ON provider_notifications;
CREATE POLICY "Providers can view own notifications"
  ON provider_notifications
  FOR SELECT
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Providers can mark own notifications as read" ON provider_notifications;
CREATE POLICY "Providers can mark own notifications as read"
  ON provider_notifications
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Admins can view provider notifications" ON provider_notifications;
CREATE POLICY "Admins can view provider notifications"
  ON provider_notifications
  FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'user_type') = 'admin');

DROP POLICY IF EXISTS "Service role can insert provider notifications" ON provider_notifications;
CREATE POLICY "Service role can insert provider notifications"
  ON provider_notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can update provider notifications" ON provider_notifications;
CREATE POLICY "Service role can update provider notifications"
  ON provider_notifications
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMIT;
