import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
// Import the new function and remove the old one
import { getLocationBySlug, getListingsByLocation } from '../../services/locations';

export default function CityLocation() {
  const router = useRouter();
  const { id } = router.query;
  
  const [locationData, setLocationData] = useState({
    location: null,
    listings: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    // Only fetch data when id (slug) is available
    if (!id) return;
    
    async function fetchLocationData() {
      let locationId = null; // Variable to store the actual location ID
      try {
        // Fetch location details using the slug from the URL
        const { location: foundLocation, error: locationError } = await getLocationBySlug(id);
        
        if (locationError) {
          // If location not found by slug, set specific error or re-throw
          if (locationError.message.includes('Location not found')) {
             setLocationData(prev => ({
               ...prev,
               loading: false,
               location: null, // Ensure location is null
               error: `Location "${id}" not found.`
             }));
             return; // Stop execution if location not found
          }
          throw locationError; // Throw other errors
        }

        // If location found, store its actual ID
        locationId = foundLocation.id;
        
        // Fetch listings using the actual location ID
        const { listings, error: listingsError } = await getListingsByLocation(locationId);
        
        if (listingsError) throw listingsError;
        
        // Update state with the found location and its listings
        setLocationData({
          location: foundLocation, // Use the location found by slug
          listings,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error(`Error loading data for location slug "${id}" (ID: ${locationId}):`, error);
        setLocationData(prev => ({
          ...prev,
          loading: false,
          // Keep existing location/listings if only listings fetch failed after location was found
          error: 'Failed to load location data. Please try again.'
        }));
      }
    }
    
    fetchLocationData();
  }, [id]);

  if (!id || locationData.loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-900"></div>
        </div>
      </Layout>
    );
  }

  // Handle error state
  if (locationData.error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{locationData.error}</p>
            <button 
              className="mt-4 text-purple-700"
              onClick={() => router.back()}
            >
              &larr; Go Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Handle no location found
  if (!locationData.location) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 p-4 rounded-md">
            <p className="text-yellow-700">Location not found.</p>
            <Link href="/cities" className="mt-4 text-purple-700 block">
              &larr; Browse all cities
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const { location, listings } = locationData;

  return (
    <Layout>
      <Head>
        <title>{`Dommes in ${location.city}, ${location.state} | DommeDirectory`}</title>
        <meta name="description" content={`Find professional dommes in ${location.city}, ${location.state}`} />
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cities" className="text-purple-700">
            &larr; Browse all cities
          </Link>
          <h1 className="text-3xl font-bold text-purple-900 mt-2">
            Dommes in {location.city}, {location.state}
          </h1>
          <p className="text-gray-600 mt-2">
            {listings.length} {listings.length === 1 ? 'domme' : 'dommes'} available in this area
          </p>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <h2 className="text-xl font-medium text-gray-800 mb-4">No listings yet</h2>
            <p className="text-gray-600 mb-4">
              Be the first to create a listing in {location.city}!
            </p>
            <Link 
              href="/listings/create"
              className="inline-block bg-purple-700 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-800 transition-colors"
            >
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Listing image or placeholder */}
                <div className="relative h-64 w-full bg-gray-200">
                  {listing.primaryImage ? (
                    <img
                      src={listing.primaryImage}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  
                  {listing.is_featured && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                      Featured
                    </div>
                  )}
                </div>
                
                {/* Listing details */}
                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 truncate">
                    {listing.title}
                  </h2>
                  <p className="text-purple-700 font-medium mb-2">
                    {listing.profiles.display_name}
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {listing.description}
                  </p>
                  <Link 
                    href={`/listings/${listing.id}`}
                    className="block w-full text-center bg-purple-700 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-800 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
