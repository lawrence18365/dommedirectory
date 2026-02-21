import crypto from 'crypto';
import { getUserFromRequest } from '../../../services/auth';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';
import { applyRateLimit, getClientIp } from '../../../utils/rateLimit';

const ALLOWED_EVENT_TYPES = new Set([
  'listing_view',
  'contact_email_click',
  'contact_phone_click',
  'contact_website_click',
  'contact_booking_click',
  'report_submitted',
]);

const IP_SALT = process.env.LEAD_EVENT_HASH_SALT;
if (!IP_SALT && process.env.NODE_ENV === 'production') {
  throw new Error('LEAD_EVENT_HASH_SALT env var is required in production');
}

const hashIp = (ip) => {
  if (!ip) return null;
  const salt = IP_SALT || 'dev-salt';
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

  if (!applyRateLimit(req, res, { maxRequests: 180 })) return;

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return res.status(503).json({ error: 'Server is not configured' });
  }

  try {
    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body || '{}')
        : req.body || {};

    const {
      listingId,
      eventType,
      visitorId = null,
      sessionId = null,
      cityPage = null,
      pagePath = null,
      referrer = null,
      utm_source = null,
      utm_medium = null,
      utm_campaign = null,
      utm_term = null,
      utm_content = null,
      metadata = {},
    } = body;

    if (!listingId || !eventType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!ALLOWED_EVENT_TYPES.has(eventType)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    const [{ data: listing, error: listingError }, user] = await Promise.all([
      admin
        .from('listings')
        .select('id, profile_id, is_active')
        .eq('id', listingId)
        .maybeSingle(),
      getUserFromRequest(req),
    ]);

    if (listingError) {
      return res.status(500).json({ error: 'Failed to resolve listing' });
    }

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (!listing.is_active) {
      return res.status(410).json({ error: 'Listing is inactive' });
    }

    const insertPayload = {
      listing_id: listing.id,
      profile_id: listing.profile_id || null,
      actor_user_id: user?.id || null,
      visitor_id: visitorId,
      session_id: sessionId,
      event_type: eventType,
      city_page: cityPage,
      page_path: pagePath,
      referrer,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      user_agent: req.headers['user-agent'] || null,
      ip_hash: hashIp(getClientIp(req)),
      metadata: metadata && typeof metadata === 'object' ? metadata : {},
    };

    const { error: insertError } = await admin.from('lead_events').insert([insertPayload]);
    if (insertError) {
      return res.status(500).json({ error: 'Failed to record event' });
    }

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error('Lead tracking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
