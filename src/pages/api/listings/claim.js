import { getAuthTokenFromRequest, getUserFromRequest } from '../../../services/auth';
import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';
import { normalizeEmail } from '../../../utils/seededContact';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 40 })) return;

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
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const listingId = (body.listingId || '').toString().trim();

    if (!listingId) {
      return res.status(400).json({ error: 'listingId is required' });
    }

    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, is_seeded, profile_id, is_active, seed_contact_email')
      .eq('id', listingId)
      .maybeSingle();

    if (listingError) {
      return res.status(500).json({ error: 'Failed to load listing' });
    }

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (!listing.is_seeded || listing.profile_id || !listing.is_active) {
      return res.status(409).json({ error: 'Listing is not claimable' });
    }

    const seedEmail = normalizeEmail(listing.seed_contact_email);
    if (!seedEmail) {
      return res.status(409).json({ error: 'Claim unavailable for this listing' });
    }

    const authEmail = normalizeEmail(user.email);
    if (!authEmail || authEmail !== seedEmail) {
      return res.status(403).json({ error: 'Claim email mismatch' });
    }

    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await admin
      .from('listings')
      .update({
        profile_id: user.id,
        claimed_at: now,
        updated_at: now,
      })
      .eq('id', listing.id)
      .is('profile_id', null)
      .eq('is_seeded', true)
      .eq('is_active', true)
      .select('id')
      .maybeSingle();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to claim listing' });
    }

    if (!updated) {
      return res.status(409).json({ error: 'Listing was already claimed' });
    }

    return res.status(200).json({ success: true, listingId: listing.id });
  } catch (error) {
    console.error('Listing claim API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
