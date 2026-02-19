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

const REPORT_REASONS = [
  'Fake photos',
  'Inappropriate content',
  'Scam or fraud',
  'Safety concern',
  'Other',
];

const REPORT_STATUSES = ['open', 'reviewed', 'dismissed', 'escalated'];

export default function AdminReportsPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [reviewNotes, setReviewNotes] = useState({});
  const [filters, setFilters] = useState({
    city: '',
    status: 'open',
    reason: '',
    listingId: '',
    reporterType: '',
    dateFrom: '',
    dateTo: '',
  });

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

  const toQueryString = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (!value) return;
      params.set(key, value);
    });
    return params.toString();
  };

  const loadQueue = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken(supabase);
      if (!token) throw new Error('Authentication token missing');

      const queryString = toQueryString();
      const response = await fetch(`/api/admin/reports${queryString ? `?${queryString}` : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to load report queue');
      }

      setReports(result.reports || []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load report queue');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (reportId, action) => {
    setSubmittingId(reportId);
    setError(null);

    try {
      const token = await getToken(supabase);
      if (!token) throw new Error('Authentication token missing');

      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportId,
          action,
          notes: reviewNotes[reportId] || '',
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to update report');
      }

      await loadQueue();
    } catch (actionError) {
      setError(actionError.message || 'Unable to process report action');
    } finally {
      setSubmittingId(null);
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
        <title>Admin Reports | DommeDirectory</title>
        <meta name="description" content="Moderation report triage queue" />
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 bg-red-700 text-white">
            <h1 className="text-xl font-bold">Moderation Report Queue</h1>
            <p className="text-sm mt-1">Filter, triage, and enforce listing safety actions.</p>
          </div>

          {error && (
            <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="p-5 grid md:grid-cols-4 gap-3">
            <input
              type="text"
              value={filters.city}
              onChange={(e) => setFilters((prev) => ({ ...prev, city: e.target.value }))}
              placeholder="City"
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {REPORT_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <select
              value={filters.reason}
              onChange={(e) => setFilters((prev) => ({ ...prev, reason: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All reasons</option>
              {REPORT_REASONS.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
            <select
              value={filters.reporterType}
              onChange={(e) => setFilters((prev) => ({ ...prev, reporterType: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            >
              <option value="">All reporters</option>
              <option value="anon">Anonymous</option>
              <option value="auth">Authenticated</option>
            </select>
            <input
              type="text"
              value={filters.listingId}
              onChange={(e) => setFilters((prev) => ({ ...prev, listingId: e.target.value }))}
              placeholder="Listing UUID"
              className="border border-gray-300 rounded px-3 py-2 text-sm md:col-span-2"
            />
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={loadQueue}
              className="md:col-span-4 bg-red-700 hover:bg-red-800 text-white rounded px-3 py-2 text-sm font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
              No reports match current filters.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-white rounded-lg shadow border border-gray-200 p-5">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Report ID: {report.id}</p>
                    <p className="text-base font-semibold text-gray-900">
                      {report.listings?.title || 'Untitled listing'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Reason: {report.reason} | Status: {report.status}
                    </p>
                    <p className="text-sm text-gray-600">
                      City: {report.listings?.locations?.city || '-'} | Reporter: {report.reporter_user_id ? 'Authenticated' : 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Listing active: {report.listings?.is_active ? 'Yes' : 'No'} | Created: {new Date(report.created_at).toLocaleString()}
                    </p>
                    {report.details && (
                      <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded p-2 mt-2">
                        {report.details}
                      </p>
                    )}
                  </div>

                  <div className="w-full lg:w-[480px] space-y-3">
                    <textarea
                      rows={3}
                      value={reviewNotes[report.id] || ''}
                      onChange={(e) => setReviewNotes((prev) => ({ ...prev, [report.id]: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="Moderation note (stored in audit log + notification payload)"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(report.id, 'resolve')}
                        disabled={submittingId === report.id}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm rounded px-3 py-2 disabled:opacity-50"
                      >
                        Resolve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(report.id, 'reject')}
                        disabled={submittingId === report.id}
                        className="bg-gray-700 hover:bg-gray-800 text-white text-sm rounded px-3 py-2 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(report.id, 'request_changes')}
                        disabled={submittingId === report.id}
                        className="bg-blue-700 hover:bg-blue-800 text-white text-sm rounded px-3 py-2 disabled:opacity-50"
                      >
                        Request Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(report.id, 'soft_hide')}
                        disabled={submittingId === report.id}
                        className="bg-red-700 hover:bg-red-800 text-white text-sm rounded px-3 py-2 disabled:opacity-50"
                      >
                        Soft Hide
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(report.id, 'escalate_verification')}
                        disabled={submittingId === report.id}
                        className="bg-amber-700 hover:bg-amber-800 text-white text-sm rounded px-3 py-2 disabled:opacity-50 md:col-span-2"
                      >
                        Escalate Verification
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
