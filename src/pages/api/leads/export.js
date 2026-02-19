import { getAuthTokenFromRequest, getUserFromRequest } from '../../../services/auth';
import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';

const VALID_DAYS = new Set([30, 90]);

const toCsvCell = (value) => {
  if (value === null || value === undefined) return '';
  const asString = String(value);
  if (/[",\n]/.test(asString)) {
    return `"${asString.replace(/"/g, '""')}"`;
  }
  return asString;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 60 })) return;

  const token = getAuthTokenFromRequest(req);
  const user = await getUserFromRequest(req);
  if (!token || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return res.status(503).json({ error: 'Server is not configured' });
  }

  try {
    const days = Number(req.query.days || 30);
    const normalizedDays = VALID_DAYS.has(days) ? days : 30;
    const listingId = (req.query.listingId || '').toString().trim() || null;

    const boundary = new Date(Date.now() - normalizedDays * 24 * 60 * 60 * 1000).toISOString();

    let query = admin
      .from('lead_events')
      .select(`
        id,
        listing_id,
        event_type,
        city_page,
        page_path,
        referrer,
        utm_source,
        utm_medium,
        utm_campaign,
        visitor_id,
        session_id,
        created_at
      `)
      .eq('profile_id', user.id)
      .gte('created_at', boundary)
      .order('created_at', { ascending: false });

    if (listingId) {
      query = query.eq('listing_id', listingId);
    }

    const { data: events, error } = await query;
    if (error) {
      return res.status(500).json({ error: 'Failed to export lead events' });
    }

    const listingIds = [...new Set((events || []).map((event) => event.listing_id).filter(Boolean))];
    let listingTitleMap = new Map();
    if (listingIds.length > 0) {
      const { data: listings } = await admin
        .from('listings')
        .select('id, title')
        .in('id', listingIds);
      listingTitleMap = new Map((listings || []).map((listing) => [listing.id, listing.title || '']));
    }

    const headers = [
      'created_at',
      'listing_id',
      'listing_title',
      'event_type',
      'city_page',
      'page_path',
      'referrer',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'visitor_id',
      'session_id',
    ];

    const rows = (events || []).map((event) => ([
      event.created_at,
      event.listing_id,
      listingTitleMap.get(event.listing_id) || '',
      event.event_type,
      event.city_page,
      event.page_path,
      event.referrer,
      event.utm_source,
      event.utm_medium,
      event.utm_campaign,
      event.visitor_id,
      event.session_id,
    ]));

    const csv = [
      headers.map(toCsvCell).join(','),
      ...rows.map((row) => row.map(toCsvCell).join(',')),
    ].join('\n');

    const filename = `lead-events-${normalizedDays}d-${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Lead export API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
