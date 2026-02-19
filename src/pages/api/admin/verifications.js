import {
  getAuthTokenFromRequest,
  getUserFromRequest,
} from '../../../services/auth';
import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';

const isAdminUser = (user) => user?.user_metadata?.user_type === 'admin';

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
      const { data, error } = await admin
        .from('verifications')
        .select(`
          id,
          profile_id,
          document_urls,
          status,
          tier_requested,
          tier_granted,
          notes,
          created_at,
          updated_at,
          profiles!inner(id, display_name, contact_email, profile_picture_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: 'Failed to load verifications' });
      }

      return res.status(200).json({ verifications: data || [] });
    } catch (error) {
      console.error('Admin verification GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    if (!applyRateLimit(req, res, { maxRequests: 60 })) return;

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      const { verificationId, decision, tierGranted, notes } = body;

      if (!verificationId || !decision) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (!['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({ error: 'Invalid decision' });
      }

      const safeTier =
        decision === 'approved' && ['basic', 'pro'].includes(tierGranted)
          ? tierGranted
          : decision === 'approved'
            ? 'basic'
            : null;

      const { data: current, error: currentError } = await admin
        .from('verifications')
        .select('id, profile_id, status, tier_granted')
        .eq('id', verificationId)
        .maybeSingle();

      if (currentError) {
        return res.status(500).json({ error: 'Failed to load verification record' });
      }

      if (!current) {
        return res.status(404).json({ error: 'Verification not found' });
      }

      const now = new Date().toISOString();
      const verificationUpdatePayload = {
        status: decision,
        tier_granted: safeTier,
        reviewed_by: user.id,
        reviewed_at: now,
        notes: notes || null,
        updated_at: now,
      };

      const profileUpdatePayload = {
        is_verified: decision === 'approved',
        verification_tier: decision === 'approved' ? safeTier : null,
        updated_at: now,
      };

      const [{ error: verificationError }, { error: profileError }, { error: auditError }] =
        await Promise.all([
          admin
            .from('verifications')
            .update(verificationUpdatePayload)
            .eq('id', verificationId),
          admin
            .from('profiles')
            .update(profileUpdatePayload)
            .eq('id', current.profile_id),
          admin.from('verification_audit_logs').insert([
            {
              verification_id: verificationId,
              profile_id: current.profile_id,
              actor_user_id: user.id,
              action: decision,
              previous_status: current.status,
              new_status: decision,
              previous_tier: current.tier_granted,
              new_tier: safeTier,
              notes: notes || null,
            },
          ]),
        ]);

      if (verificationError || profileError || auditError) {
        console.error('Verification review error:', verificationError || profileError || auditError);
        return res.status(500).json({ error: 'Failed to update verification' });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Admin verification PATCH error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
