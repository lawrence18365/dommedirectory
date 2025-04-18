import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import Layout from '../../components/layout/Layout';
import { useProfile } from '../../context/ProfileContext'; // Import useProfile

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useSupabaseClient(); // Keep supabase client for the update operation
  const user = useUser();
  const { profile, loading: profileLoading, error: profileError, refetchProfile } = useProfile(); // Use context
  
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Set initial display name from context once profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
    }
  }, [profile]);

  // Handle profile loading error from context
  useEffect(() => {
    if (profileError) {
      setMessage({ type: 'error', text: `Could not load profile data: ${profileError}` });
    }
  }, [profileError]);

  // Redirect if not logged in (user object check is primary)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Redirect if user object is definitively null after context has had a chance to load
      if (!user && !profileLoading) {
        router.push('/auth/login');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user, profileLoading, router]);

  const handleDisplayNameChange = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating display name:', error);
      setMessage({ type: 'error', text: 'Failed to update display name. Please try again.' });
    } else {
      setMessage({ type: 'success', text: 'Display name updated successfully!' });
      refetchProfile(); // Trigger profile refetch in context
    }
    setIsSubmitting(false);
  };

  // Use context loading state
  const isLoading = !user || profileLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-900"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Account Settings | DommeDirectory</title>
        <meta name="description" content="Manage your account settings" />
      </Head>

      <div className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8"> {/* Adjusted max-width */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Account Settings</h1>
          
          {/* Display Name Form */}
          <form onSubmit={handleDisplayNameChange} className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                    Display Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="display_name"
                      id="display_name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
              {message.text && (
                <p className={`mt-3 text-sm ${message.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                  {message.text}
                </p>
              )}
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Display Name'}
              </button>
            </div>
          </form>

          {/* Placeholder for other settings sections */}
          {/*
          <div className="mt-8 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Password</h3>
              <p className="mt-4 text-gray-600">Password settings form will go here.</p>
            </div>
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button type="button" className="...">Change Password</button>
            </div>
          </div>
          */}

        </div>
      </div>
    </Layout>
  );
}