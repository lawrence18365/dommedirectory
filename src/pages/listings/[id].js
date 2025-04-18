import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Layout from '../../components/layout/Layout';
import { getListingById } from '../../services/listings';

export default function ListingDetail() {
  const router = useRouter();
  const { id } = router.query;
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [listing, setListing] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    async function loadListingData() {
      try {
        const { listing: listingData, error: listingError } = await getListingById(id);
        if (listingError) throw listingError;
        
        if (!listingData) {
          setError('Listing not found');
          return;
        }
        
        setListing(listingData);
        
        // Find primary image
        const primaryIndex = listingData.media?.findIndex(m => m.is_primary);
        if (primaryIndex !== -1 && primaryIndex !== undefined) {
          setActiveImageIndex(primaryIndex);
        }
      } catch (error) {
        console.error('Error loading listing data:', error);
        setError('Failed to load listing data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadListingData();
  }, [id]);

  const isOwner = user && listing && user.id === listing.profile_id;

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-900"></div>
        </div>
      </Layout>
    );
  }

  if (error || !listing) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Listing not found</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      The listing you're looking for could not be found. It may have been removed or is no longer active.
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        type="button"
                        onClick={() => router.push('/cities')}
                        className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100"
                      >
                        Browse Listings
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
        <title>{listing.title} | DommeDirectory</title>
        <meta name="description" content={listing.description?.substring(0, 160)} />
      </Head>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`/location/${listing.location_id}`} className="text-purple-700">
            &larr; Back to {listing.locations.city}, {listing.locations.state}
          </Link>
        </div>

        {/* Listing Header */}
        <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 bg-purple-700 text-white">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">{listing.title}</h1>
              {listing.is_featured && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Featured
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-purple-100">
              {listing.locations.city}, {listing.locations.state}, {listing.locations.country}
            </p>
          </div>
          
          {isOwner && (
            <div className="bg-purple-50 px-4 py-3 sm:px-6 border-b border-purple-100">
              <div className="flex justify-between items-center">
                <p className="text-sm text-purple-700">
                  You are viewing your own listing
                </p>
                <Link 
                  href={`/listings/edit/${listing.id}`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
                >
                  Edit Listing
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Listing Media */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              {listing.media && listing.media.length > 0 ? (
                <div>
                  <div className="aspect-w-16 aspect-h-9 relative">
                    <img
                      src={listing.media[activeImageIndex].storage_path}
                      alt={listing.title}
                      className="w-full h-96 object-cover object-center"
                    />
                  </div>
                  
                  {listing.media.length > 1 && (
                    <div className="p-4 grid grid-cols-6 gap-2">
                      {listing.media.map((media, index) => (
                        <button
                          key={media.id}
                          onClick={() => setActiveImageIndex(index)}
                          className={`relative aspect-square h-16 w-16 rounded-md overflow-hidden border-2 focus:outline-none ${
                            index === activeImageIndex ? 'border-purple-500' : 'border-transparent'
                          }`}
                        >
                          <img
                            src={media.storage_path}
                            alt={`Thumbnail ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-100">
                  <p className="text-gray-500">No images available</p>
                </div>
              )}
              
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <div className="prose max-w-none text-gray-700">
                  <p>{listing.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile & Contact Info */}
          <div className="mt-10 lg:mt-0">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {listing.profiles.display_name}
                </h3>
                
                {listing.profiles.is_verified && (
                  <div className="mb-4 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="mr-1 h-3 w-3 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  </div>
                )}
                
                {listing.profiles.bio && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">About</h4>
                    <p className="text-sm text-gray-600">
                      {listing.profiles.bio}
                    </p>
                  </div>
                )}
                
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Location</h4>
                  <p className="text-sm text-gray-600">
                    {listing.locations.city}, {listing.locations.state}, {listing.locations.country}
                  </p>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-t border-gray-200 pt-4">Services</h3>
                
                {Object.entries(listing.services || {}).filter(([_, included]) => included).length > 0 ? (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(listing.services || {})
                        .filter(([_, included]) => included)
                        .map(([service]) => (
                          <span key={service} className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {service}
                          </span>
                        ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-6">No services specified</p>
                )}
                
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-t border-gray-200 pt-4">Rates</h3>
                
                {Object.entries(listing.rates || {}).filter(([_, rate]) => rate).length > 0 ? (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      {listing.rates?.hourly && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Hourly</h4>
                          <p className="text-lg font-semibold text-gray-900">${listing.rates.hourly}</p>
                        </div>
                      )}
                      
                      {listing.rates?.twoHour && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">2 Hours</h4>
                          <p className="text-lg font-semibold text-gray-900">${listing.rates.twoHour}</p>
                        </div>
                      )}
                      
                      {listing.rates?.halfDay && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Half Day</h4>
                          <p className="text-lg font-semibold text-gray-900">${listing.rates.halfDay}</p>
                        </div>
                      )}
                      
                      {listing.rates?.fullDay && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700">Full Day</h4>
                          <p className="text-lg font-semibold text-gray-900">${listing.rates.fullDay}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-6">No rates specified</p>
                )}
                
                <h3 className="text-lg font-medium text-gray-900 mb-4 border-t border-gray-200 pt-4">Contact</h3>
                
                {(listing.profiles.contact_email || listing.profiles.contact_phone || listing.profiles.website) ? (
                  <div className="space-y-3">
                    {listing.profiles.contact_email && (
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <a href={`mailto:${listing.profiles.contact_email}`} className="text-purple-700 hover:text-purple-900">
                          {listing.profiles.contact_email}
                        </a>
                      </div>
                    )}
                    
                    {listing.profiles.contact_phone && (
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <a href={`tel:${listing.profiles.contact_phone}`} className="text-purple-700 hover:text-purple-900">
                          {listing.profiles.contact_phone}
                        </a>
                      </div>
                    )}
                    
                    {listing.profiles.website && (
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <a href={listing.profiles.website} target="_blank" rel="noopener noreferrer" className="text-purple-700 hover:text-purple-900">
                          {listing.profiles.website}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No contact information provided</p>
                )}
                
                {/* Social Links */}
                {listing.profiles.social_links && Object.values(listing.profiles.social_links).some(link => link) && (
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media</h3>
                    <div className="flex items-center space-x-4">
                      {listing.profiles.social_links.twitter && (
                        <a 
                          href={`https://twitter.com/${listing.profiles.social_links.twitter}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-400"
                        >
                          <span className="sr-only">Twitter</span>
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                      )}
                      
                      {listing.profiles.social_links.instagram && (
                        <a 
                          href={`https://instagram.com/${listing.profiles.social_links.instagram}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-pink-600"
                        >
                          <span className="sr-only">Instagram</span>
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                      
                      {listing.profiles.social_links.onlyfans && (
                        <a 
                          href={`https://onlyfans.com/${listing.profiles.social_links.onlyfans}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <span className="sr-only">OnlyFans</span>
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-3.5-8.5c0-1.933 1.567-3.5 3.5-3.5s3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5-3.5-1.567-3.5-3.5z"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
