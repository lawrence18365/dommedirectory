import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
// import { getTopLocations } from '../services/locations'; // Removed dynamic fetch

export default function Home() {
  // Define the static list of featured locations
  const staticFeaturedLocations = [
    { id: 'vancouver', city: 'Vancouver', state: 'BC', country: 'Canada', listing_count: 0, imageUrl: 'https://images.unsplash.com/photo-1559511260-66a654ae982a' }, // Updated URL
    { id: 'toronto', city: 'Toronto', state: 'ON', country: 'Canada', listing_count: 0, imageUrl: 'https://images.unsplash.com/photo-1517935706615-2717063c2225' }, // Updated URL
    { id: 'new-york', city: 'New York', state: 'NY', country: 'USA', listing_count: 0, imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80' }, // Kept old URL
    { id: 'los-angeles', city: 'Los Angeles', state: 'CA', country: 'USA', listing_count: 0, imageUrl: 'https://images.unsplash.com/photo-1503891450247-ee5f8ec46dc3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80' }, // Kept old URL
    { id: 'chicago', city: 'Chicago', state: 'IL', country: 'USA', listing_count: 0, imageUrl: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80' }, // Kept old URL
    { id: 'houston', city: 'Houston', state: 'TX', country: 'USA', listing_count: 0, imageUrl: 'https://images.unsplash.com/photo-1470082719408-b2843ab5c9ab' }, // Updated URL
    { id: 'miami', city: 'Miami', state: 'FL', country: 'USA', listing_count: 0, imageUrl: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80' }, // Kept old URL
    { id: 'seattle', city: 'Seattle', state: 'WA', country: 'USA', listing_count: 0, imageUrl: 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362' }, // Updated URL
  ];

  // Use state to hold the static list (though loading/error states are less relevant now)
  const [featuredLocations, setFeaturedLocations] = useState({
    locations: staticFeaturedLocations,
    loading: false, // No longer loading dynamically
    error: null,
  });

  // useEffect(() => {
  //   async function loadFeaturedLocations() {
  //     try {
  //       const { locations, error } = await getTopLocations(8);
  //       if (error) throw error;
  //       setFeaturedLocations({ locations: locations || [], loading: false, error: null });
  //     } catch (error) {
  //       console.error('Error loading top locations:', error);
  //       setFeaturedLocations(prev => ({ ...prev, loading: false, error: 'Failed to load featured locations' }));
  //     }
  //   }
  //   loadFeaturedLocations();
  // }, []); // Removed useEffect dependency array and logic

  return (
    <Layout>
      <Head>
        <title>DommeDirectory - Find Professional Dommes in Your City</title>
        <meta name="description" content="Browse professional dommes in cities across North America. Create your profile and connect with clients." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Find Professional Dommes in Your City
          </h1>
          <p className="mt-6 text-xl max-w-3xl mx-auto">
            Browse listings in major cities across North America or create your own profile to connect with clients.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/cities"
              className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-purple-700 bg-white hover:bg-gray-50 md:text-lg"
            >
              Browse Cities
            </Link>
            <Link
              href="/auth/register"
              className="px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800 md:text-lg"
            >
              Create Your Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Cities */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Featured Cities
        </h2>

        {featuredLocations.loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-900"></div>
          </div>
        ) : featuredLocations.error ? (
          <div className="text-center text-red-600">
            {featuredLocations.error}
          </div>
        ) : featuredLocations.locations.length === 0 ? (
          <div className="text-center text-gray-600">
            <p>No featured cities yet.</p>
            <Link href="/cities" className="text-purple-600 hover:text-purple-800 mt-2 inline-block">
              Browse all cities
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredLocations.locations.map((location) => (
              <Link
                key={location.id} // Use static ID or city name as key
                href={`/location/${location.id}`} // Link might need adjustment if IDs aren't real
                className="group relative overflow-hidden rounded-lg shadow-md h-48 flex items-end" // Changed alignment
              >
                <img src={location.imageUrl} alt={location.city} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-purple-900 opacity-70 group-hover:opacity-80 transition-opacity"></div>
                <div className="absolute bottom-0 w-full p-4 text-white">
                  <h3 className="text-xl font-semibold">{location.city}</h3>
                  <p className="text-sm">{location.state}, {location.country}</p>
                  {location.listing_count > 0 && (
                    <span className="inline-block mt-1 text-xs bg-purple-600 px-2 py-1 rounded-full">
                      {location.listing_count} {location.listing_count === 1 ? 'Listing' : 'Listings'}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
        
        <div className="text-center mt-10">
          <Link 
            href="/cities" 
            className="inline-block px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800"
          >
            View All Cities
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
              <p className="text-gray-600">Sign up and create your professional profile with photos, services, and rates.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Verified</h3>
              <p className="text-gray-600">Complete our verification process to build trust with potential clients.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect With Clients</h3>
              <p className="text-gray-600">Start receiving inquiries from clients browsing in your area.</p>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <Link 
              href="/auth/register" 
              className="inline-block px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800"
            >
              Get Started Today
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
