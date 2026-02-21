import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate the caller
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const { listingId, requestId } = req.body;
  if (!listingId || !requestId) {
    return res.status(400).json({ error: 'listingId and requestId are required' });
  }

  // Call the DB function — it handles all eligibility checks
  const { data, error } = await supabaseAdmin.rpc('grant_claim_trial', {
    p_profile_id: user.id,
    p_listing_id: listingId,
    p_request_id: requestId,
  });

  if (error) {
    console.error('grant_claim_trial error:', error);
    return res.status(500).json({ error: 'Failed to activate trial' });
  }

  if (!data?.ok) {
    return res.status(400).json({ error: data?.error || 'Not eligible for trial' });
  }

  return res.status(200).json({ ok: true, seconds: data.seconds });
}
