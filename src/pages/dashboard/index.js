import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useUser } from '@supabase/auth-helpers-react'; // Removed useSupabaseClient as it's not directly used here anymore for profile
import Layout from '../../components/layout/Layout';
import { getListingsByProfile } from '../../services/listings';
import { checkVerificationStatus } from '../../services/profiles';
import { useProfile } from '../../context/ProfileContext'; // Import useProfile

export default function Dashboard() {
  const router = useRouter();
  const user = useUser();
  const { profile, loading: profileLoading, error: profileError } = useProfile(); // Use profile context
  const [listings, setListings] = useState([]);
  const [verification, setVerification] = useState({ status: null, loading: true });
  const [dashboardLoading, setDashboardLoading] = useState(true); // Separate loading state for dashboard-specific data

  useEffect(() => {
    if (!user) {
      // If user object isn't available yet, wait. ProfileContext handles redirect if user remains null.
      return;
    }
    
    // If profile context has an error, stop loading dashboard data
    if (profileError) {
        console.error('Error from ProfileContext:', profileError);
        setDashboardLoading(false);
        // Optionally show an error message specific to profile loading failure
        return;
    }

    // If profile is loaded from context, fetch dashboard specific data
    if (!profileLoading && user) {
      async function loadDashboardSpecificData() {
        setDashboardLoading(true); // Start loading dashboard specific data
        try {
          // Fetch verification status
          const { status: verificationStatus, error: verificationError } = await checkVerificationStatus(user.id);
          if (!verificationError) {
            setVerification({ status: verificationStatus, loading: false });
          } else {
             console.error('Error fetching verification status:', verificationError);
             setVerification({ status: null, loading: false }); // Update state even on error
          }

          // Fetch listings
          const { listings: listingsData, error: listingsError } = await getListingsByProfile(user.id);
          if (!listingsError) {
            setListings(listingsData || []);
          } else {
            console.error('Error fetching listings:', listingsError);
          }
        } catch (error) {
          console.error('Error loading dashboard specific data:', error);
        } finally {
          setDashboardLoading(false); // Finish loading dashboard specific data
        }
      }
      loadDashboardSpecificData();
    }
    // Intentionally exclude supabase from dependency array if only used for profile fetch (now handled by context)
  }, [user, profileLoading, profileError, router]); // Depend on user and profile context state

  // Combined loading state: wait for user, profile context, and dashboard specific data
  const isLoading = !user || profileLoading || dashboardLoading;

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
        <title>Dashboard | DommeDirectory</title>
        <meta name="description" content="Manage your DommeDirectory profile and listings" />
      </Head>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-purple-700 text-white">
              <h1 className="text-xl font-bold">
                Welcome, {profile?.display_name} {/* Remove fallback to email */}
              </h1>
              <p className="mt-1 text-sm">
                Manage your profile, listings, and account settings
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h2 className="font-semibold text-gray-900">Profile Status</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {/* Check if profile and locations exist before accessing nested properties */}
                    {profile?.primary_location_id && profile.locations ? (
                      <>Located in {profile.locations.city}, {profile.locations.state}</>
                    ) : profile && !profile.primary_location_id ? (
                      <>No primary location set</>
                    ) : (
                      <>Loading location...</> // Or handle profile loading state
                    )}
                  </p>
                  <Link 
                    href="/profile" 
                    className="mt-3 inline-block text-sm text-purple-700 hover:text-purple-800"
                  >
                    Edit Profile &rarr;
                  </Link>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h2 className="font-semibold text-gray-900">Verification Status</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {verification.loading ? (
                      <>Checking status...</>
                    ) : verification.status === 'approved' ? (
                      <span className="text-green-600 font-medium">Verified ✓</span>
                    ) : verification.status === 'pending' ? (
                      <span className="text-yellow-600 font-medium">Pending Review</span>
                    ) : verification.status === 'rejected' ? (
                      <span className="text-red-600 font-medium">Rejected</span>
                    ) : (
                      <span className="text-gray-600">Not Submitted</span>
                    )}
                  </p>
                  <Link 
                    href="/verification" 
                    className="mt-3 inline-block text-sm text-purple-700 hover:text-purple-800"
                  >
                    {verification.status === 'approved' ? 'View Verification' : 
                     verification.status === 'pending' ? 'Check Status' :
                     verification.status === 'rejected' ? 'Resubmit Verification' : 
                     'Get Verified'} &rarr;
                  </Link>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h2 className="font-semibold text-gray-900">Listings</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {listings.length} active listing{listings.length !== 1 ? 's' : ''}
                  </p>
                  <Link 
                    href="/listings/create" 
                    className="mt-3 inline-block text-sm text-purple-700 hover:text-purple-800"
                  >
                    Create New Listing &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Section */}
        <div className="px-4 py-6 sm:px-0 mt-6">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Your Listings
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage your current listings or create a new one
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              {listings.length === 0 ? (
                <div className="text-center py-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No listings yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating your first listing
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/listings/create"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Create a Listing
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.map((listing) => (
                    <div key={listing.id} className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md">
                      <div className="h-48 bg-gray-200">
                        {/* Listing image would go here */}
                        <div className="flex items-center justify-center h-full bg-gray-100">
                          <span className="text-gray-400">No image</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {listing.locations.city}, {listing.locations.state}
                        </p>
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                          {listing.description}
                        </p>
                        <div className="mt-4 flex justify-between">
                          <Link
                            href={`/listings/${listing.id}`}
                            className="text-sm font-medium text-purple-700 hover:text-purple-800"
                          >
                            View
                          </Link>
                          <Link
                            href={`/listings/edit/${listing.id}`}
                            className="text-sm font-medium text-purple-700 hover:text-purple-800"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                      {!listing.is_active && (
                        <div className="absolute top-0 right-0 m-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                          Inactive
                        </div>
                      )}
                      {listing.is_featured && (
                        <div className="absolute top-0 left-0 m-2 px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                          Featured
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verification Section (if not verified) */}
        {verification.status !== 'approved' && verification.status !== 'pending' && (
          <div className="px-4 py-6 sm:px-0 mt-6">
            <div className="bg-purple-50 shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-purple-100">
                <h2 className="text-lg font-medium text-gray-900">
                  Get Verified
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Verification helps build trust with potential clients
                </p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="sm:flex sm:items-center">
                  <div className="sm:flex-auto">
                    <p className="text-sm text-gray-700">
                      Verified profiles receive more views and build client trust. The verification process is simple and secure.
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <Link
                      href="/verification"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      Start Verification
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
