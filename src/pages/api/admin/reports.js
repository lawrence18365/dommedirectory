import {
  getAuthTokenFromRequest,
  getUserFromRequest,
} from '../../../services/auth';
import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';

const isAdminUser = (user) => user?.user_metadata?.user_type === 'admin';

const VALID_ACTIONS = new Set([
  'resolve',
  'reject',
  'request_changes',
  'soft_hide',
  'escalate_verification',
]);

const STATUS_BY_ACTION = {
  resolve: 'reviewed',
  reject: 'dismissed',
  request_changes: 'reviewed',
  soft_hide: 'reviewed',
  escalate_verification: 'escalated',
};

const NOTIFICATION_BY_ACTION = {
  resolve: {
    type: 'report_resolved',
    title: 'Listing report resolved',
    message: 'A report on your listing was reviewed and resolved.',
  },
  reject: {
    type: 'report_rejected',
    title: 'Listing report dismissed',
    message: 'A report on your listing was reviewed and dismissed.',
  },
  request_changes: {
    type: 'report_request_changes',
    title: 'Listing update requested',
    message: 'Moderation requested updates to your listing details.',
  },
  soft_hide: {
    type: 'report_soft_hidden',
    title: 'Listing temporarily hidden',
    message: 'Your listing was temporarily hidden pending moderation follow-up.',
  },
  escalate_verification: {
    type: 'report_escalated_verification',
    title: 'Verification review required',
    message: 'Your listing was escalated for additional verification review.',
  },
};

const normalizeIsoDate = (input) => {
  if (!input) return null;
  const parsed = new Date(input);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString();
};

export default async function handler(req, res) {
  const token = getAuthTokenFromRequest(req);
  const user = await getUserFromRequest(req);

  if (!token || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!isAdminUser(user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return res.status(503).json({ error: 'Server is not configured' });
  }

  if (req.method === 'GET') {
    try {
      const {
        status = '',
        reason = '',
        listingId = '',
        reporterType = '',
        city = '',
        dateFrom = '',
        dateTo = '',
      } = req.query;

      let query = admin
        .from('listing_reports')
        .select(`
          id,
          listing_id,
          reported_profile_id,
          reporter_user_id,
          reason,
          details,
          status,
          source_page,
          created_at,
          reviewed_by,
          reviewed_at,
          listings!inner(
            id,
            title,
            is_active,
            profile_id,
            location_id,
            locations(id, city, state, country)
          ),
          reported_profile:profiles!reported_profile_id(
            id,
            display_name,
            contact_email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(400);

      if (status) query = query.eq('status', String(status));
      if (reason) query = query.eq('reason', String(reason));
      if (listingId) query = query.eq('listing_id', String(listingId));
      if (reporterType === 'anon') query = query.is('reporter_user_id', null);
      if (reporterType === 'auth') query = query.not('reporter_user_id', 'is', null);

      const fromIso = normalizeIsoDate(dateFrom);
      const toIso = normalizeIsoDate(dateTo);
      if (fromIso) query = query.gte('created_at', fromIso);
      if (toIso) query = query.lte('created_at', toIso);

      const { data, error } = await query;
      if (error) {
        return res.status(500).json({ error: 'Failed to load report queue' });
      }

      const normalizedCity = city.toString().trim().toLowerCase();
      const rows = (data || []).filter((row) => {
        if (!normalizedCity) return true;
        const cityName = row?.listings?.locations?.city || '';
        return cityName.toLowerCase().includes(normalizedCity);
      });

      return res.status(200).json({ reports: rows });
    } catch (error) {
      console.error('Admin reports GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    if (!applyRateLimit(req, res, { maxRequests: 120 })) return;

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const reportId = body.reportId || null;
      const action = body.action || null;
      const notes = (body.notes || '').toString().trim() || null;

      if (!reportId || !VALID_ACTIONS.has(action)) {
        return res.status(400).json({ error: 'Valid reportId and action are required' });
      }

      const { data: report, error: reportError } = await admin
        .from('listing_reports')
        .select(`
          id,
          listing_id,
          reported_profile_id,
          status,
          listings!inner(id, profile_id, title, is_active)
        `)
        .eq('id', reportId)
        .maybeSingle();

      if (reportError) {
        return res.status(500).json({ error: 'Failed to load report' });
      }

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const previousStatus = report.status;
      const newStatus = STATUS_BY_ACTION[action];
      const previousListingActive = Boolean(report.listings?.is_active);
      let newListingActive = previousListingActive;
      const now = new Date().toISOString();

      const { error: reportUpdateError } = await admin
        .from('listing_reports')
        .update({
          status: newStatus,
          reviewed_by: user.id,
          reviewed_at: now,
        })
        .eq('id', reportId);

      if (reportUpdateError) {
        return res.status(500).json({ error: 'Failed to update report status' });
      }

      if (action === 'soft_hide') {
        const { error: listingUpdateError } = await admin
          .from('listings')
          .update({
            is_active: false,
            updated_at: now,
          })
          .eq('id', report.listing_id);

        if (listingUpdateError) {
          return res.status(500).json({ error: 'Failed to update listing state' });
        }

        newListingActive = false;
      }

      if (action === 'escalate_verification' && report.reported_profile_id) {
        const { data: pendingVerification, error: pendingVerificationError } = await admin
          .from('verifications')
          .select('id')
          .eq('profile_id', report.reported_profile_id)
          .eq('status', 'pending')
          .limit(1)
          .maybeSingle();

        if (!pendingVerificationError && !pendingVerification) {
          await admin.from('verifications').insert([
            {
              profile_id: report.reported_profile_id,
              document_urls: [],
              status: 'pending',
              tier_requested: 'pro',
              notes: notes || 'Escalated from moderation queue',
              created_at: now,
              updated_at: now,
            },
          ]);
        }
      }

      const notificationTargetProfileId =
        report.reported_profile_id || report.listings?.profile_id || null;
      if (notificationTargetProfileId) {
        const notification = NOTIFICATION_BY_ACTION[action];
        await admin.from('provider_notifications').insert([
          {
            profile_id: notificationTargetProfileId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            payload: {
              report_id: report.id,
              listing_id: report.listing_id,
              action,
              notes,
            },
          },
        ]);
      }

      const { error: auditError } = await admin.from('listing_report_audit_logs').insert([
        {
          report_id: report.id,
          listing_id: report.listing_id,
          actor_user_id: user.id,
          action,
          previous_status: previousStatus,
          new_status: newStatus,
          previous_listing_active: previousListingActive,
          new_listing_active: newListingActive,
          notes,
        },
      ]);

      if (auditError) {
        return res.status(500).json({ error: 'Failed to write moderation audit log' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Admin reports PATCH error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
