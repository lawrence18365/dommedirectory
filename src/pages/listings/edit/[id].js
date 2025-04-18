import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import Layout from '../../../components/layout/Layout';
import { getAllLocations } from '../../../services/locations';
import { getListingById, updateListing, uploadListingMedia, deleteMedia } from '../../../services/listings';

export default function EditListing() {
  const router = useRouter();
  const { id } = router.query;
  const supabase = useSupabaseClient();
  const user = useUser();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [locations, setLocations] = useState([]);
  const [listing, setListing] = useState(null);
  const [existingMedia, setExistingMedia] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [primaryMediaId, setPrimaryMediaId] = useState(null);
  const [newPrimaryMediaIndex, setNewPrimaryMediaIndex] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    locationId: '',
    services: {},
    rates: {
      hourly: '',
      twoHour: '',
      halfDay: '',
      fullDay: '',
    },
  });

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!id) return;

    async function loadListingData() {
      try {
        // Load listing
        const { listing: listingData, error: listingError } = await getListingById(id);
        if (listingError) throw listingError;
        
        if (!listingData) {
          setError('Listing not found');
          return;
        }
        
        // Check if user owns this listing
        if (listingData.profile_id !== user.id) {
          router.push('/dashboard');
          return;
        }
        
        setListing(listingData);
        setExistingMedia(listingData.media || []);
        
        // Find primary media
        const primaryMedia = listingData.media?.find(m => m.is_primary);
        if (primaryMedia) {
          setPrimaryMediaId(primaryMedia.id);
        }
        
        // Set form data
        setFormData({
          title: listingData.title || '',
          description: listingData.description || '',
          locationId: listingData.location_id || '',
          services: listingData.services || {},
          rates: {
            hourly: listingData.rates?.hourly || '',
            twoHour: listingData.rates?.twoHour || '',
            halfDay: listingData.rates?.halfDay || '',
            fullDay: listingData.rates?.fullDay || '',
          },
        });

        // Load locations
        const { locations: locationsData, error: locationsError } = await getAllLocations();
        if (locationsError) throw locationsError;
        setLocations(locationsData || []);
      } catch (error) {
        console.error('Error loading listing data:', error);
        setError('Failed to load listing data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadListingData();
  }, [user, router, id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('rates.')) {
      const rateKey = name.split('.')[1];
      setFormData({
        ...formData,
        rates: {
          ...formData.rates,
          [rateKey]: value,
        }
      });
    } else if (name.startsWith('services.')) {
      const serviceKey = name.split('.')[1];
      const isChecked = e.target.checked;
      
      setFormData({
        ...formData,
        services: {
          ...formData.services,
          [serviceKey]: isChecked,
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      
      // Filter files (only images, max size check, etc.)
      const validFiles = newFiles.filter(file => 
        file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
      );
      
      if (validFiles.length !== newFiles.length) {
        setError('Some files were not added. Files must be images under 5MB.');
      }
      
      setUploadedMedia(prev => [...prev, ...validFiles]);
    }
  };

  const removeUploadedMedia = (index) => {
    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
    
    if (newPrimaryMediaIndex === index) {
      setNewPrimaryMediaIndex(null);
    } else if (newPrimaryMediaIndex !== null && newPrimaryMediaIndex > index) {
      setNewPrimaryMediaIndex(prev => prev - 1);
    }
  };

  const removeExistingMedia = async (mediaId) => {
    try {
      const { error } = await deleteMedia(mediaId);
      if (error) throw error;
      
      setExistingMedia(prev => prev.filter(m => m.id !== mediaId));
      
      if (primaryMediaId === mediaId) {
        setPrimaryMediaId(null);
      }
    } catch (error) {
      console.error('Error removing media:', error);
      setError('Failed to remove media. Please try again.');
    }
  };

  const setExistingMediaAsPrimary = async (mediaId) => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('media')
        .update({ is_primary: true })
        .eq('id', mediaId);
      
      if (error) throw error;
      
      // Update other media in the same listing to not be primary
      const { error: updateError } = await supabase
        .from('media')
        .update({ is_primary: false })
        .eq('listing_id', id)
        .neq('id', mediaId);
      
      if (updateError) throw updateError;
      
      // Update local state
      setPrimaryMediaId(mediaId);
      setNewPrimaryMediaIndex(null);
      
      // Update existing media state
      setExistingMedia(prev => 
        prev.map(m => ({
          ...m,
          is_primary: m.id === mediaId
        }))
      );
    } catch (error) {
      console.error('Error setting primary media:', error);
      setError('Failed to set primary media. Please try again.');
    }
  };

  const setNewMediaAsPrimary = (index) => {
    setNewPrimaryMediaIndex(index);
    setPrimaryMediaId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.locationId) {
      setError('Please fill out all required fields.');
      return;
    }
    
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    
    try {
      // Update the listing
      const { error: updateError } = await updateListing(id, {
        title: formData.title,
        description: formData.description,
        locationId: formData.locationId,
        services: formData.services,
        rates: formData.rates,
      });
      
      if (updateError) throw updateError;
      
      // Upload new media files if any
      if (uploadedMedia.length > 0) {
        for (let i = 0; i < uploadedMedia.length; i++) {
          const isPrimary = i === newPrimaryMediaIndex;
          await uploadListingMedia(id, user.id, uploadedMedia[i], isPrimary);
        }
      }
      
      setSuccess(true);
      setTimeout(() => router.push(`/listings/${id}`), 1500);
    } catch (error) {
      console.error('Error updating listing:', error);
      setError('Failed to update listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-900"></div>
        </div>
      </Layout>
    );
  }

  if (error === 'Listing not found') {
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
                      The listing you're trying to edit could not be found. Please return to your dashboard and try again.
                    </p>
                  </div>
                  <div className="mt-4">
                    <div className="-mx-2 -my-1.5 flex">
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100"
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
        <title>Edit Listing | DommeDirectory</title>
        <meta name="description" content="Edit your listing on DommeDirectory" />
      </Head>

      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 bg-purple-700 text-white">
              <h1 className="text-xl font-bold">Edit Listing</h1>
              <p className="mt-1 text-sm">
                Update your listing information
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 sm:px-6 bg-red-50 text-red-700 border-b border-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="px-4 py-3 sm:px-6 bg-green-50 text-green-700 border-b border-green-200">
                Listing updated successfully! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Listing Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={5}
                      value={formData.description}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="locationId"
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    >
                      <option value="">Select a location</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.city}, {location.state}, {location.country}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Existing Media */}
              {existingMedia.length > 0 && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Current Media</h2>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {existingMedia.map((media) => (
                      <div key={media.id} className={`relative group border rounded-md overflow-hidden ${media.is_primary || media.id === primaryMediaId ? 'ring-2 ring-purple-500' : ''}`}>
                        <img
                          src={media.storage_path}
                          alt="Listing media"
                          className="h-32 w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setExistingMediaAsPrimary(media.id)}
                            className="p-1 bg-purple-500 text-white rounded-full mx-1"
                            title="Set as primary"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeExistingMedia(media.id)}
                            className="p-1 bg-red-500 text-white rounded-full mx-1"
                            title="Remove"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {(media.is_primary || media.id === primaryMediaId) && (
                          <div className="absolute top-0 left-0 bg-purple-500 text-white text-xs px-2 py-1">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Media Upload */}
              <div>
                <h2 className="text-lg font-medium text-gray-900">Add New Photos</h2>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Upload Media</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-purple-600 hover:text-purple-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500">
                          <span>Upload files</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
                
                {uploadedMedia.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                    {uploadedMedia.map((file, index) => (
                      <div key={index} className={`relative group border rounded-md overflow-hidden ${index === newPrimaryMediaIndex ? 'ring-2 ring-purple-500' : ''}`}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Upload ${index + 1}`}
                          className="h-32 w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setNewMediaAsPrimary(index)}
                            className="p-1 bg-purple-500 text-white rounded-full mx-1"
                            title="Set as primary"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeUploadedMedia(index)}
                            className="p-1 bg-red-500 text-white rounded-full mx-1"
                            title="Remove"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {index === newPrimaryMediaIndex && (
                          <div className="absolute top-0 left-0 bg-purple-500 text-white text-xs px-2 py-1">
                            Primary
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Services Offered */}
              <div>
                <h2 className="text-lg font-medium text-gray-900">Services Offered</h2>
                <div className="mt-4 grid grid-cols-1 gap-y-2 sm:grid-cols-2 gap-x-4">
                  {[
                    'Bondage', 'Discipline', 'Domination', 'Submission', 'Sadism', 
                    'Masochism', 'Roleplay', 'Fetish', 'CBT', 'Spanking', 'Humiliation',
                    'Foot Worship', 'Pegging', 'Financial Domination', 'Sissy Training'
                  ].map((service) => (
                    <div key={service} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`service-${service}`}
                          name={`services.${service}`}
                          type="checkbox"
                          checked={formData.services[service] || false}
                          onChange={handleChange}
                          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`service-${service}`} className="font-medium text-gray-700">
                          {service}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rates */}
              <div>
                <h2 className="text-lg font-medium text-gray-900">Rates</h2>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 gap-x-4">
                  <div>
                    <label htmlFor="rates.hourly" className="block text-sm font-medium text-gray-700">
                      Hourly Rate
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        name="rates.hourly"
                        id="rates.hourly"
                        value={formData.rates.hourly}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rates.twoHour" className="block text-sm font-medium text-gray-700">
                      2-Hour Rate
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        name="rates.twoHour"
                        id="rates.twoHour"
                        value={formData.rates.twoHour}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rates.halfDay" className="block text-sm font-medium text-gray-700">
                      Half-Day Rate
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        name="rates.halfDay"
                        id="rates.halfDay"
                        value={formData.rates.halfDay}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rates.fullDay" className="block text-sm font-medium text-gray-700">
                      Full-Day Rate
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="text"
                        name="rates.fullDay"
                        id="rates.fullDay"
                        value={formData.rates.fullDay}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-7 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-5">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push(`/listings/${id}`)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
