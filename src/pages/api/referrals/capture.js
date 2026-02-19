import crypto from 'crypto';
import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';

const REFERRAL_CODE_REGEX = /^[a-z0-9]{6,32}$/;

const generateEventCode = () => `rfe_${crypto.randomBytes(12).toString('hex')}`;

const normalizeCity = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 120);
};

const normalizeUtm = (value) => {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 120) : null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 50 })) return;

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return res.status(503).json({ error: 'Server is not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const shareCode = (body.shareCode || '').toString().trim().toLowerCase();

    if (!REFERRAL_CODE_REGEX.test(shareCode)) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }

    const { data: referrer, error: referrerError } = await admin
      .from('profiles')
      .select('id')
      .eq('referral_share_code', shareCode)
      .maybeSingle();

    if (referrerError) {
      return res.status(500).json({ error: 'Failed to validate referral code' });
    }

    if (!referrer) {
      return res.status(404).json({ error: 'Referral code not found' });
    }

    const sourceCity = normalizeCity(body.sourceCity);
    const utm_source = normalizeUtm(body.utm_source);
    const utm_medium = normalizeUtm(body.utm_medium);
    const utm_campaign = normalizeUtm(body.utm_campaign);

    let eventCode = null;
    let insertError = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateEventCode();
      const { error } = await admin.from('referrals').insert([
        {
          code: candidate,
          referrer_profile_id: referrer.id,
          source_city: sourceCity,
          utm_source,
          utm_medium,
          utm_campaign,
        },
      ]);

      if (!error) {
        eventCode = candidate;
        insertError = null;
        break;
      }

      if (error.code !== '23505') {
        insertError = error;
        break;
      }
    }

    if (!eventCode) {
      console.error('Referral capture insert error:', insertError);
      return res.status(500).json({ error: 'Failed to capture referral' });
    }

    return res.status(201).json({ referralEventCode: eventCode });
  } catch (error) {
    console.error('Referral capture API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
