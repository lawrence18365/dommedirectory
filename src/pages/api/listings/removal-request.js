import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';
import { normalizeEmail } from '../../../utils/seededContact';

const isValidReason = (value) =>
  typeof value === 'string' && value.trim().length >= 3 && value.trim().length <= 2000;

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
    const listingId = (body.listingId || '').toString().trim();
    const requesterEmail = normalizeEmail(body.requesterEmail);
    const reason = (body.reason || '').toString().trim();

    if (!listingId || !requesterEmail || !isValidReason(reason)) {
      return res.status(400).json({ error: 'listingId, requesterEmail and reason are required' });
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

    const now = new Date().toISOString();

    const { data: requestRow, error: insertError } = await admin
      .from('listing_removal_requests')
      .insert([
        {
          listing_id: listing.id,
          requester_email: requesterEmail,
          reason,
        },
      ])
      .select('id')
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to submit removal request' });
    }

    const seedEmail = normalizeEmail(listing.seed_contact_email);
    const canAutoRemove =
      Boolean(listing.is_seeded) &&
      !listing.profile_id &&
      Boolean(listing.is_active) &&
      Boolean(seedEmail) &&
      requesterEmail === seedEmail;

    if (canAutoRemove) {
      const [{ error: deactivateError }, { error: resolveError }] = await Promise.all([
        admin
          .from('listings')
          .update({
            is_active: false,
            removed_at: now,
            removed_reason: 'opt_out',
            updated_at: now,
          })
          .eq('id', listing.id),
        admin
          .from('listing_removal_requests')
          .update({
            resolved_at: now,
            resolution: 'auto-removed',
          })
          .eq('id', requestRow.id),
      ]);

      if (deactivateError || resolveError) {
        return res.status(500).json({ error: 'Failed to auto-remove listing' });
      }

      return res.status(200).json({ success: true, autoRemoved: true });
    }

    return res.status(200).json({
      success: true,
      autoRemoved: false,
      message: 'Request submitted for manual review',
    });
  } catch (error) {
    console.error('Listing removal request API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
