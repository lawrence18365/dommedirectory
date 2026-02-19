import {
  getAuthTokenFromRequest,
  getUserFromRequest,
} from '../../../services/auth';
import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';

const isAdminUser = (user) => user?.user_metadata?.user_type === 'admin';

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
  const token = getAuthTokenFromRequest(req);
  const user = await getUserFromRequest(req);

  if (!token || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!isAdminUser(user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const admin = getSupabaseAdminClient();
  if (!admin) {
    return res.status(503).json({ error: 'Server is not configured' });
  }

  if (req.method === 'GET') {
    try {
      const [creditsResult, referralsResult, locationsResult] = await Promise.all([
        admin
          .from('featured_credits')
          .select(`
            id,
            profile_id,
            city_id,
            seconds_granted,
            seconds_used,
            reason,
            created_at,
            profiles!inner(id, display_name, contact_email)
          `)
          .order('created_at', { ascending: false })
          .limit(200),
        admin
          .from('referrals')
          .select(`
            id,
            code,
            referrer_profile_id,
            referred_profile_id,
            created_at,
            attributed_at,
            source_city,
            utm_source,
            utm_medium,
            utm_campaign
          `)
          .order('created_at', { ascending: false })
          .limit(200),
        admin
          .from('locations')
          .select('id, city, state, country')
          .eq('is_active', true)
          .order('country', { ascending: true })
          .order('state', { ascending: true })
          .order('city', { ascending: true }),
      ]);

      if (creditsResult.error || referralsResult.error || locationsResult.error) {
        return res.status(500).json({ error: 'Failed to load featured credits data' });
      }

      const credits = (creditsResult.data || []).map((credit) => ({
        ...credit,
        remaining_seconds: Math.floor(getRemainingSeconds(credit)),
      }));

      return res.status(200).json({
        credits,
        referrals: referralsResult.data || [],
        locations: locationsResult.data || [],
      });
    } catch (error) {
      console.error('Admin featured credits GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    if (!applyRateLimit(req, res, { maxRequests: 80 })) return;

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const profileId = body.profileId || null;
      const cityId = body.cityId || null;
      const seconds = Number(body.seconds || 0);
      const reason = (body.reason || '').toString().trim() || 'Manual featured credit grant';

      if (!profileId || !Number.isFinite(seconds) || seconds <= 0) {
        return res.status(400).json({ error: 'Valid profileId and positive seconds are required' });
      }

      if (seconds > 31_536_000) {
        return res.status(400).json({ error: 'Grant exceeds maximum allowed duration' });
      }

      const [{ error: grantError }, { error: auditError }] = await Promise.all([
        admin.from('featured_credits').insert([
          {
            profile_id: profileId,
            city_id: cityId,
            seconds_granted: Math.floor(seconds),
            seconds_used: 0,
            reason,
          },
        ]),
        admin.from('featured_credit_audit_logs').insert([
          {
            profile_id: profileId,
            city_id: cityId,
            actor_user_id: user.id,
            action: 'grant',
            seconds_delta: Math.floor(seconds),
            reason,
            metadata: {
              source: 'admin_panel',
            },
          },
        ]),
      ]);

      if (grantError || auditError) {
        console.error('Featured credit grant error:', grantError || auditError);
        return res.status(500).json({ error: 'Failed to grant featured credits' });
      }

      return res.status(201).json({ success: true });
    } catch (error) {
      console.error('Admin featured credits POST error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    if (!applyRateLimit(req, res, { maxRequests: 80 })) return;

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const creditId = body.creditId || null;
      const reason = (body.reason || '').toString().trim() || 'Manual featured credit revoke';

      if (!creditId) {
        return res.status(400).json({ error: 'creditId is required' });
      }

      const { data: credit, error: creditError } = await admin
        .from('featured_credits')
        .select('id, profile_id, city_id, seconds_granted, seconds_used, created_at')
        .eq('id', creditId)
        .maybeSingle();

      if (creditError) {
        return res.status(500).json({ error: 'Failed to load credit row' });
      }

      if (!credit) {
        return res.status(404).json({ error: 'Credit row not found' });
      }

      const remainingSeconds = Math.floor(getRemainingSeconds(credit));

      const [{ error: revokeError }, { error: auditError }] = await Promise.all([
        admin
          .from('featured_credits')
          .update({
            seconds_used: Number(credit.seconds_granted || 0),
          })
          .eq('id', credit.id),
        admin.from('featured_credit_audit_logs').insert([
          {
            profile_id: credit.profile_id,
            city_id: credit.city_id,
            actor_user_id: user.id,
            action: 'revoke',
            seconds_delta: -Math.max(0, remainingSeconds),
            reason,
            metadata: {
              source: 'admin_panel',
              credit_id: credit.id,
            },
          },
        ]),
      ]);

      if (revokeError || auditError) {
        console.error('Featured credit revoke error:', revokeError || auditError);
        return res.status(500).json({ error: 'Failed to revoke featured credits' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Admin featured credits PATCH error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
