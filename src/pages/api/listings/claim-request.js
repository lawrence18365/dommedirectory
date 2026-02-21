import { getAuthTokenFromRequest, getUserFromRequest } from '../../../services/auth';
import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';

const VALID_PROOF_METHODS = new Set(['website_code', 'source_profile_code']);

const normalizeProofLocation = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > 500) return null;
  return normalized;
};

const buildVerificationCode = (listingId, userId) => {
  const listingToken = (listingId || '').replace(/-/g, '').slice(0, 6).toUpperCase();
  const userToken = (userId || '').replace(/-/g, '').slice(0, 6).toUpperCase();
  return `DD-${listingToken}-${userToken}`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 30 })) return;

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
    const proofMethod = (body.proofMethod || '').toString().trim();
    const proofLocation = normalizeProofLocation(body.proofLocation);

    if (!listingId || !VALID_PROOF_METHODS.has(proofMethod) || !proofLocation) {
      return res.status(400).json({ error: 'listingId, proofMethod and proofLocation are required' });
    }

    const { data: listing, error: listingError } = await admin
      .from('listings')
      .select('id, is_seeded, profile_id, is_active')
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

    const verificationCode = buildVerificationCode(listing.id, user.id);

    const { data: existingPending, error: pendingError } = await admin
      .from('listing_claim_requests')
      .select('id, verification_code, status')
      .eq('listing_id', listing.id)
      .eq('requester_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingError) {
      return res.status(500).json({ error: 'Failed to load existing claim request' });
    }

    if (existingPending) {
      return res.status(200).json({
        success: true,
        reused: true,
        requestId: existingPending.id,
        verificationCode: existingPending.verification_code || verificationCode,
      });
    }

    const now = new Date().toISOString();
    const { data: created, error: insertError } = await admin
      .from('listing_claim_requests')
      .insert([
        {
          listing_id: listing.id,
          requester_user_id: user.id,
          requester_email: user.email || null,
          proof_method: proofMethod,
          proof_location: proofLocation,
          verification_code: verificationCode,
          status: 'pending',
          created_at: now,
          updated_at: now,
        },
      ])
      .select('id')
      .single();

    if (insertError) {
      return res.status(500).json({ error: 'Failed to submit claim request' });
    }

    return res.status(201).json({
      success: true,
      requestId: created.id,
      verificationCode,
    });
  } catch (error) {
    console.error('Listing claim request API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
