import crypto from 'crypto';
import { getAuthTokenFromRequest, getUserFromRequest } from '../../../services/auth';
import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';

const randomShareCode = () => `ref${crypto.randomBytes(6).toString('hex')}`;

const getBaseUrl = (req) => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured && configured.trim()) {
    return configured.replace(/\/+$/, '');
  }

  const host = req.headers.host;
  const protocolHeader = req.headers['x-forwarded-proto'];
  const protocol = Array.isArray(protocolHeader)
    ? protocolHeader[0]
    : protocolHeader || 'https';
  if (!host) return '';
  return `${protocol}://${host}`;
};

const getRemainingSeconds = (credit) => {
  const createdAtMs = new Date(credit.created_at).getTime();
  const elapsed = Number.isFinite(createdAtMs)
    ? Math.max(0, (Date.now() - createdAtMs) / 1000)
    : 0;

  const granted = Number(credit.seconds_granted || 0);
  const used = Number(credit.seconds_used || 0);
  return Math.max(0, granted - used - elapsed);
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 90 })) return;

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
    let { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, referral_share_code')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ error: 'Failed to load profile' });
    }

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (!profile.referral_share_code) {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = randomShareCode();
        const { error: updateError } = await admin
          .from('profiles')
          .update({
            referral_share_code: candidate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (!updateError) {
          profile = { ...profile, referral_share_code: candidate };
          break;
        }

        if (updateError.code !== '23505') {
          profileError = updateError;
          break;
        }
      }

      if (!profile.referral_share_code) {
        console.error('Referral share code update error:', profileError);
        return res.status(500).json({ error: 'Failed to generate referral link' });
      }
    }

    const [attributedResult, pendingResult, creditsResult] = await Promise.all([
      admin
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_profile_id', user.id)
        .not('referred_profile_id', 'is', null),
      admin
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_profile_id', user.id)
        .is('referred_profile_id', null),
      admin
        .from('featured_credits')
        .select('seconds_granted, seconds_used, created_at')
        .eq('profile_id', user.id),
    ]);

    if (attributedResult.error || pendingResult.error || creditsResult.error) {
      return res.status(500).json({ error: 'Failed to load referral stats' });
    }

    const activeCreditSeconds = (creditsResult.data || []).reduce(
      (acc, credit) => acc + getRemainingSeconds(credit),
      0
    );

    const baseUrl = getBaseUrl(req);
    const shareCode = profile.referral_share_code;
    const shareUrl = `${baseUrl}/auth/register?ref=${encodeURIComponent(shareCode)}`;

    return res.status(200).json({
      shareCode,
      shareUrl,
      totalAttributed: attributedResult.count || 0,
      pendingCaptures: pendingResult.count || 0,
      activeCreditSeconds: Math.floor(activeCreditSeconds),
    });
  } catch (error) {
    console.error('Referral link API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
