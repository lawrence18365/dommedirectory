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

export default function AdminVerifications() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [selectedTiers, setSelectedTiers] = useState({});
  const [reviewNotes, setReviewNotes] = useState({});

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

    loadQueue();
  }, [user, isAdmin, router]);

  const loadQueue = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken(supabase);
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const response = await fetch('/api/admin/verifications', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to load verification queue');
      }

      const queue = result.verifications || [];
      setPendingVerifications(queue);

      const nextTiers = {};
      queue.forEach((item) => {
        nextTiers[item.id] = item.tier_requested || 'basic';
      });
      setSelectedTiers(nextTiers);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (verificationId, decision) => {
    setSubmittingId(verificationId);
    setError(null);

    try {
      const token = await getToken(supabase);
      if (!token) {
        throw new Error('Authentication token missing');
      }

      const response = await fetch('/api/admin/verifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verificationId,
          decision,
          tierGranted: selectedTiers[verificationId] || 'basic',
          notes: reviewNotes[verificationId] || '',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to update verification');
      }

      setPendingVerifications((prev) => prev.filter((item) => item.id !== verificationId));
    } catch (actionError) {
      setError(actionError.message || 'Unable to update verification');
    } finally {
      setSubmittingId(null);
    }
  };

  if (!user || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-900"></div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>Admin Verifications | DommeDirectory</title>
        <meta name="description" content="Verification queue and tier approvals" />
      </Head>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-red-700 text-white">
              <h1 className="text-xl font-bold">Verification Queue</h1>
              <p className="mt-1 text-sm">
                Approve or reject verification requests with explicit Basic/Pro tiers.
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 sm:px-6 bg-red-50 text-red-700 border-b border-red-200">
                {error}
              </div>
            )}

            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Pending Verifications ({pendingVerifications.length})
              </h2>

              {pendingVerifications.length === 0 ? (
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending verifications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Queue is clear. New submissions will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingVerifications.map((verification) => (
                    <div key={verification.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {verification.profiles?.display_name || 'Unknown provider'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {verification.profiles?.contact_email || 'No contact email'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted {new Date(verification.created_at).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Requested tier: {verification.tier_requested || 'basic'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Documents: {verification.document_urls?.length || 0}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(verification.document_urls || []).map((url, index) => (
                              <a
                                key={`${verification.id}-doc-${index}`}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-red-700 hover:text-red-900 underline"
                              >
                                View document {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>

                        <div className="w-full md:w-80 space-y-3">
                          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Grant Tier
                          </label>
                          <select
                            value={selectedTiers[verification.id] || 'basic'}
                            onChange={(e) =>
                              setSelectedTiers((prev) => ({
                                ...prev,
                                [verification.id]: e.target.value,
                              }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          >
                            <option value="basic">Basic Verified</option>
                            <option value="pro">Pro Verified</option>
                          </select>

                          <textarea
                            rows={3}
                            value={reviewNotes[verification.id] || ''}
                            onChange={(e) =>
                              setReviewNotes((prev) => ({
                                ...prev,
                                [verification.id]: e.target.value,
                              }))
                            }
                            placeholder="Optional review note"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAction(verification.id, 'approved')}
                              disabled={submittingId === verification.id}
                              className="flex-1 text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 py-2 px-3 rounded text-sm font-medium disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(verification.id, 'rejected')}
                              disabled={submittingId === verification.id}
                              className="flex-1 text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 py-2 px-3 rounded text-sm font-medium disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
