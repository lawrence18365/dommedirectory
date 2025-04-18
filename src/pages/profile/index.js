import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useUser } from '@supabase/auth-helpers-react';
import { getProfile } from '../../services/profiles';
import Layout from '../../components/layout/Layout';
import Link from 'next/link'; // For edit link

const ProfilePage = () => {
  const router = useRouter();
  const user = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Wait until the user object is definitely loaded
    if (user === undefined) {
      setLoading(true);
      return; // Still loading user state
    }
    if (!user) {
      // User is loaded, but null -> redirect to login
      router.push('/auth/login?redirect=/profile');
      return;
    }

    // User is loaded and exists, fetch profile
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      console.log('Fetching profile for user ID:', user.id); // Add logging
      const { profile: fetchedProfile, error: fetchError } = await getProfile(user.id);
      if (fetchError) {
        setError('Failed to load profile data. Please try again.');
        console.error('Profile fetch error:', fetchError);
      } else {
        setProfile(fetchedProfile);
      }
      setLoading(false);
    };
    fetchProfile();

  }, [user, router]); // Rerun effect when user object changes

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-900"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
     return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-lg text-center">
           <p className="text-red-500">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
     return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-lg text-center">
           <p>Could not find profile information.</p>
           {/* Optionally add a button to create profile if applicable */}
        </div>
      </Layout>
    );
  }

  // Display profile information
  return (
    <Layout>
      <Head>
        <title>Your Profile | DommeDirectory</title>
      </Head>
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Profile</h1>

          <div className="mb-4">
            <strong className="block text-gray-700">Display Name:</strong>
            <p className="text-gray-900">{profile.display_name || 'Not set'}</p>
          </div>

          <div className="mb-4">
            <strong className="block text-gray-700">Email:</strong>
            <p className="text-gray-900">{user.email}</p> {/* Email comes from user object */}
          </div>

          <div className="mb-4">
            <strong className="block text-gray-700">Primary Location:</strong>
            <p className="text-gray-900">
              {profile.locations
                ? `${profile.locations.city}, ${profile.locations.state}, ${profile.locations.country}`
                : 'Not set'}
            </p>
          </div>

          <div className="mb-4">
            <strong className="block text-gray-700">Bio:</strong>
            <p className="text-gray-900 whitespace-pre-wrap">{profile.bio || 'Not set'}</p>
          </div>

          {/* Add more profile fields as needed */}

          <div className="mt-6 text-right">
            {/* Link to an edit page (which might also need creating) */}
            <Link href="/profile/edit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;