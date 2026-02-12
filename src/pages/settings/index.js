import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import Layout from '../../components/layout/Layout';
import { useProfile } from '../../context/ProfileContext';

export default function SettingsPage() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const user = useUser();
  const { profile, loading: profileLoading, error: profileError, refetchProfile } = useProfile();

  const [formData, setFormData] = useState({
    display_name: '',
    bio: '',
    contact_email: '',
    contact_phone: '',
    website: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Set initial form data from context once profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        contact_email: profile.contact_email || '',
        contact_phone: profile.contact_phone || '',
        website: profile.website || '',
      });
    }
  }, [profile]);

  // Handle profile loading error from context
  useEffect(() => {
    if (profileError) {
      setMessage({ type: 'error', text: `Could not load profile data: ${profileError}` });
    }
  }, [profileError]);

  // Redirect if not logged in
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!user && !profileLoading) {
        router.push('/auth/login');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [user, profileLoading, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: formData.display_name,
        bio: formData.bio,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website: formData.website,
        updated_at: new Date(),
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      refetchProfile();
    }
    setIsSubmitting(false);
  };

  const isLoading = !user || profileLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
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

      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg border ${message.type === 'error'
              ? 'bg-red-900/20 border-red-500/50 text-red-200'
              : 'bg-green-900/20 border-green-500/50 text-green-200'
            }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Information */}
          <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>

            <div className="space-y-5">
              {/* Display Name */}
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-400 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#262626] text-white rounded py-2.5 px-4 border border-white/10 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-400 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell people about yourself..."
                  className="w-full bg-[#262626] text-white rounded py-2.5 px-4 border border-white/10 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors placeholder-gray-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Contact Information</h2>

            <div className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-400 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  id="contact_email"
                  name="contact_email"
                  value={formData.contact_email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full bg-[#262626] text-white rounded py-2.5 px-4 border border-white/10 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors placeholder-gray-500"
                />
                <p className="mt-1 text-xs text-gray-500">This email will be shown on your public listing.</p>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-400 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="contact_phone"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="w-full bg-[#262626] text-white rounded py-2.5 px-4 border border-white/10 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors placeholder-gray-500"
                />
              </div>

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-400 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                  className="w-full bg-[#262626] text-white rounded py-2.5 px-4 border border-white/10 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Account Info (read-only) */}
          <div className="bg-[#1a1a1a] border border-white/5 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Account</h2>
            <div className="space-y-4">
              <div>
                <span className="block text-sm font-medium text-gray-400 mb-1">Login Email</span>
                <p className="text-white">{user?.email}</p>
              </div>
              <div>
                <span className="block text-sm font-medium text-gray-400 mb-1">Verification Status</span>
                <div className="flex items-center gap-2">
                  {profile?.is_verified ? (
                    <>
                      <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Verified
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-400 text-sm">Not verified</span>
                      <Link href="/verification" className="text-red-500 hover:text-red-400 text-sm font-medium ml-2">
                        Get verified →
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}