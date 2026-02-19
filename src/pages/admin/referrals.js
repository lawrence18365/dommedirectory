import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Layout from '../../components/layout/Layout';

const getToken = async (supabase) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
};

const formatRemaining = (seconds) => {
  const safe = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(safe / 3600);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
};

export default function AdminReferralsPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [credits, setCredits] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    profileId: '',
    cityId: '',
    seconds: '604800',
    reason: 'Manual featured credit grant',
  });
  const [revokeReason, setRevokeReason] = useState('Manual featured credit revoke');

  const isAdmin = useMemo(
    () => user?.user_metadata?.user_type === 'admin',
    [user?.user_metadata?.user_type]
  );

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    loadData();
  }, [user, isAdmin, router]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken(supabase);
      if (!token) throw new Error('Authentication token missing');

      const response = await fetch('/api/admin/featured-credits', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to load referral data');
      }

      setCredits(result.credits || []);
      setReferrals(result.referrals || []);
      setLocations(result.locations || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load referral data');
    } finally {
      setLoading(false);
    }
  };

  const handleGrant = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken(supabase);
      if (!token) throw new Error('Authentication token missing');

      const response = await fetch('/api/admin/featured-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profileId: form.profileId.trim(),
          cityId: form.cityId || null,
          seconds: Number(form.seconds),
          reason: form.reason,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to grant featured credits');
      }

      await loadData();
    } catch (grantError) {
      setError(grantError.message || 'Unable to grant featured credits');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (creditId) => {
    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken(supabase);
      if (!token) throw new Error('Authentication token missing');

      const response = await fetch('/api/admin/featured-credits', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          creditId,
          reason: revokeReason,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to revoke featured credits');
      }

      await loadData();
    } catch (revokeError) {
      setError(revokeError.message || 'Unable to revoke featured credits');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-700" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) return null;

  return (
    <Layout>
      <Head>
        <title>Admin Referrals | DommeDirectory</title>
        <meta name="description" content="Manage provider referrals and featured placement credits" />
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 bg-red-700 text-white">
            <h1 className="text-xl font-bold">Referrals & Featured Credits</h1>
            <p className="text-sm mt-1">Grant or revoke featured time with full audit logging.</p>
          </div>

          {error && (
            <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="p-5">
            <form onSubmit={handleGrant} className="grid md:grid-cols-4 gap-3">
              <input
                type="text"
                value={form.profileId}
                onChange={(e) => setForm((prev) => ({ ...prev, profileId: e.target.value }))}
                placeholder="Provider profile UUID"
                className="border border-gray-300 rounded px-3 py-2 text-sm"
                required
              />
              <select
                value={form.cityId}
                onChange={(e) => setForm((prev) => ({ ...prev, cityId: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">Global (all cities)</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.city}, {location.state || '-'}, {location.country}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="60"
                step="60"
                value={form.seconds}
                onChange={(e) => setForm((prev) => ({ ...prev, seconds: e.target.value }))}
                placeholder="Seconds"
                className="border border-gray-300 rounded px-3 py-2 text-sm"
                required
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-red-700 hover:bg-red-800 text-white rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                Grant Featured Time
              </button>
              <input
                type="text"
                value={form.reason}
                onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Grant reason"
                className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-4"
              />
            </form>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Featured Credits</h2>
          </div>
          <div className="px-5 py-3 border-b border-gray-200">
            <input
              type="text"
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              className="w-full max-w-xl border border-gray-300 rounded px-3 py-2 text-sm"
              placeholder="Revoke reason"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Provider</th>
                  <th className="text-left px-4 py-3">Contact</th>
                  <th className="text-left px-4 py-3">Reason</th>
                  <th className="text-left px-4 py-3">Remaining</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {credits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No featured credits found.
                    </td>
                  </tr>
                ) : (
                  credits.map((credit) => (
                    <tr key={credit.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{credit.profiles?.display_name || credit.profile_id}</td>
                      <td className="px-4 py-3">{credit.profiles?.contact_email || '-'}</td>
                      <td className="px-4 py-3">{credit.reason}</td>
                      <td className="px-4 py-3">{formatRemaining(credit.remaining_seconds)}</td>
                      <td className="px-4 py-3">{new Date(credit.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleRevoke(credit.id)}
                          disabled={submitting || Number(credit.remaining_seconds || 0) <= 0}
                          className="text-red-700 hover:text-red-900 disabled:opacity-50"
                        >
                          Revoke
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Referrals</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Code</th>
                  <th className="text-left px-4 py-3">Referrer</th>
                  <th className="text-left px-4 py-3">Referred</th>
                  <th className="text-left px-4 py-3">Source City</th>
                  <th className="text-left px-4 py-3">UTM</th>
                  <th className="text-left px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No referrals captured yet.
                    </td>
                  </tr>
                ) : (
                  referrals.map((referral) => (
                    <tr key={referral.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-mono text-xs">{referral.code}</td>
                      <td className="px-4 py-3">{referral.referrer_profile_id}</td>
                      <td className="px-4 py-3">{referral.referred_profile_id || '-'}</td>
                      <td className="px-4 py-3">{referral.source_city || '-'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {[referral.utm_source, referral.utm_medium, referral.utm_campaign].filter(Boolean).join(' / ') || '-'}
                      </td>
                      <td className="px-4 py-3">{new Date(referral.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
