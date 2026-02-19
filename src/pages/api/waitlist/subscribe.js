import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_SUBSCRIPTION_TYPES = new Set(['city_updates', 'provider_waitlist']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 25 })) return;

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return res.status(503).json({ error: 'Server is not configured' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const {
      email,
      subscriptionType,
      citySlug = null,
      sourcePage = null,
      utm_source = null,
      utm_medium = null,
      utm_campaign = null,
    } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!VALID_SUBSCRIPTION_TYPES.has(subscriptionType)) {
      return res.status(400).json({ error: 'Invalid subscription type' });
    }

    const payload = {
      email: normalizedEmail,
      subscription_type: subscriptionType,
      city_slug: citySlug || null,
      source_page: sourcePage || null,
      utm_source,
      utm_medium,
      utm_campaign,
      status: 'active',
      updated_at: new Date().toISOString(),
    };

    const { error: insertError } = await admin
      .from('email_subscriptions')
      .insert([payload]);

    if (insertError?.code === '23505') {
      let updateQuery = admin
        .from('email_subscriptions')
        .update({
          status: 'active',
          source_page: sourcePage || null,
          utm_source,
          utm_medium,
          utm_campaign,
          updated_at: new Date().toISOString(),
        })
        .ilike('email', normalizedEmail)
        .eq('subscription_type', subscriptionType);

      if (citySlug) {
        updateQuery = updateQuery.eq('city_slug', citySlug);
      } else {
        updateQuery = updateQuery.is('city_slug', null);
      }

      const { error: updateError } = await updateQuery;
      if (updateError) {
        return res.status(500).json({ error: 'Failed to save subscription' });
      }

      return res.status(200).json({ success: true, existing: true });
    }

    if (insertError) {
      return res.status(500).json({ error: 'Failed to save subscription' });
    }

    return res.status(201).json({ success: true, existing: false });
  } catch (error) {
    console.error('Waitlist subscribe error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
