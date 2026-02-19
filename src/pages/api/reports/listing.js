import crypto from 'crypto';
import { getUserFromRequest } from '../../../services/auth';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';
import { applyRateLimit, getClientIp } from '../../../utils/rateLimit';

const VALID_REASONS = new Set([
  'Fake photos',
  'Inappropriate content',
  'Scam or fraud',
  'Safety concern',
  'Other',
]);

const hashIp = (ip) => {
  if (!ip) return null;
  const salt = process.env.LEAD_EVENT_HASH_SALT || 'dommedirectory-default-salt';
  return crypto
    .createHash('sha256')
    .update(`${salt}:${ip}`)
    .digest('hex')
    .slice(0, 32);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 30 })) return;

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return res.status(503).json({ error: 'Server is not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const {
      listingId,
      reason,
      details = '',
      sourcePage = null,
      visitorId = null,
      sessionId = null,
      cityPage = null,
      pagePath = null,
      referrer = null,
      utm_source = null,
      utm_medium = null,
      utm_campaign = null,
    } = body;

    if (!listingId || !reason) {
      return res.status(400).json({ error: 'Listing and reason are required' });
    }

    if (!VALID_REASONS.has(reason)) {
      return res.status(400).json({ error: 'Invalid report reason' });
    }

    if (details && details.length > 2000) {
      return res.status(400).json({ error: 'Report details are too long' });
    }

    const [{ data: listing, error: listingError }, user] = await Promise.all([
      admin
        .from('listings')
        .select('id, profile_id')
        .eq('id', listingId)
        .maybeSingle(),
      getUserFromRequest(req),
    ]);

    if (listingError) {
      return res.status(500).json({ error: 'Unable to load listing' });
    }

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const ipHash = hashIp(getClientIp(req));

    const [{ error: reportError }, { error: eventError }] = await Promise.all([
      admin.from('listing_reports').insert([
        {
          listing_id: listing.id,
          reported_profile_id: listing.profile_id,
          reporter_user_id: user?.id || null,
          reason,
          details: details || null,
          source_page: sourcePage,
          visitor_id: visitorId,
          session_id: sessionId,
          ip_hash: ipHash,
        },
      ]),
      admin.from('lead_events').insert([
        {
          listing_id: listing.id,
          profile_id: listing.profile_id,
          actor_user_id: user?.id || null,
          visitor_id: visitorId,
          session_id: sessionId,
          event_type: 'report_submitted',
          city_page: cityPage,
          page_path: pagePath,
          referrer,
          utm_source,
          utm_medium,
          utm_campaign,
          user_agent: req.headers['user-agent'] || null,
          ip_hash: ipHash,
          metadata: {
            reason,
            sourcePage,
          },
        },
      ]),
    ]);

    if (reportError || eventError) {
      console.error('Report submission error:', reportError || eventError);
      return res.status(500).json({ error: 'Failed to submit report' });
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Report API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
