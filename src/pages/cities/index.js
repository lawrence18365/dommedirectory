import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import { getLocationsGrouped } from '../../services/locations';

export default function CitiesDirectory() {
  const [locationsData, setLocationsData] = useState({
    locations: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    async function fetchLocations() {
      try {
        const { grouped, error } = await getLocationsGrouped();
        
        if (error) throw error;
        
        setLocationsData({
          locations: grouped,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error loading locations:', error);
        setLocationsData({
          locations: null,
          loading: false,
          error: 'Failed to load locations. Please try again.'
        });
      }
    }
    
    fetchLocations();
  }, []);

  return (
    <Layout>
      <Head>
        <title>Cities Directory | DommeDirectory</title>
        <meta name="description" content="Browse dommes by city across North America" />
      </Head>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-purple-900 mb-8">Browse by City</h1>
        
        {locationsData.loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-900"></div>
          </div>
        ) : locationsData.error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{locationsData.error}</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {Object.entries(locationsData.locations || {}).map(([country, states]) => (
              <div key={country} className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">{country}</h2>
                
                {Object.entries(states).map(([state, cities]) => (
                  <div key={state} className="mb-6">
                    <h3 className="text-xl font-medium text-gray-700 mb-3">{state}</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {cities.map((city) => (
                        <Link
                          href={`/location/${encodeURIComponent(city.city.toLowerCase())}`} // Use URL-encoded lowercase city name
                          key={city.id} // Keep key as id for uniqueness
                          className="block bg-white shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg p-4 text-center"
                        >
                          <span className="text-purple-700 font-medium">{city.city}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
