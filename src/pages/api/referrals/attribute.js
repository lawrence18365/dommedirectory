import { getAuthTokenFromRequest, getUserFromRequest } from '../../../services/auth';
import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
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
    const { error } = await admin.rpc('apply_referral_reward', {
      new_profile_id: user.id,
    });

    if (error) {
      return res.status(500).json({ error: 'Failed to process referral attribution' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Referral attribution API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
