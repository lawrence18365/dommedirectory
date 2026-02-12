import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Layout from '../../components/layout/Layout';

export default function AdminVerifications() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingVerifications, setPendingVerifications] = useState([]);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    async function checkAdminAndLoadVerifications() {
      try {
        // Check if user is admin
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (userError) throw userError;
        
        // Get user_type from auth metadata
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;
        
        const isAdminUser = authUser?.user_metadata?.user_type === 'admin';
        
        if (!isAdminUser) {
          router.push('/dashboard');
          return;
        }
        
        setIsAdmin(true);

        // Load pending verifications
        const { data: verifications, error: verificationError } = await supabase
          .from('verifications')
          .select(`
            *,
            profiles!inner(id, display_name, contact_email)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });
        
        if (verificationError) throw verificationError;
        
        setPendingVerifications(verifications || []);
      } catch (error) {
        console.error('Error loading admin data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    checkAdminAndLoadVerifications();
  }, [user, router, supabase]);

  const handleVerificationAction = async (verificationId, status, notes = '') => {
    try {
      // Update verification status
      const { error: updateError } = await supabase
        .from('verifications')
        .update({
          status,
          notes,
          updated_at: new Date(),
        })
        .eq('id', verificationId);
      
      if (updateError) throw updateError;
      
      // Update profile is_verified flag
      const verification = pendingVerifications.find(v => v.id === verificationId);
      
      if (verification) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            is_verified: status === 'approved',
            updated_at: new Date(),
          })
          .eq('id', verification.profile_id);
        
        if (profileError) throw profileError;
      }
      
      // Update local state
      setPendingVerifications(prev => prev.filter(v => v.id !== verificationId));
    } catch (error) {
      console.error('Error updating verification:', error);
      setError('Failed to update verification. Please try again.');
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
    return (
      <Layout>
        <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      You do not have permission to access this page.
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100"
                      >
                        Return to Dashboard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Admin Verifications | DommeDirectory</title>
        <meta name="description" content="Admin verification management for DommeDirectory" />
      </Head>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-red-700 text-white">
              <h1 className="text-xl font-bold">Verification Management</h1>
              <p className="mt-1 text-sm">
                Review and approve pending verification requests
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 sm:px-6 bg-red-50 text-red-700 border-b border-red-200">
                {error}
              </div>
            )}

            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Pending Verifications ({pendingVerifications.length})</h2>
              
              {pendingVerifications.length === 0 ? (
                <div className="text-center py-10">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No pending verifications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    All verification requests have been processed.
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Documents
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingVerifications.map((verification) => (
                        <tr key={verification.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                <span className="text-lg font-medium text-red-800">
                                  {verification.profiles.display_name.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {verification.profiles.display_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {verification.profiles.contact_email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(verification.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(verification.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {verification.document_urls.length} document(s)
                            </div>
                            <div className="flex space-x-2 mt-1">
                              {verification.document_urls.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-red-600 hover:text-red-900 text-xs"
                                >
                                  View Doc {index + 1}
                                </a>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleVerificationAction(verification.id, 'approved')}
                                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 py-1 px-2 rounded"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerificationAction(verification.id, 'rejected', 'Documents insufficient or unclear.')}
                                className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 py-1 px-2 rounded"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
