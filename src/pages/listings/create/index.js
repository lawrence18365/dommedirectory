import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useUser } from '@supabase/auth-helpers-react';
import Layout from '../../../components/layout/Layout';
import Link from 'next/link';
import { getAllLocations } from '../../../services/locations';
import { createListing, uploadListingMedia } from '../../../services/listings';
import { getOnboardingStatus, getProfile } from '../../../services/profiles';
import { validateListingData, sanitizeString } from '../../../utils/validation';

export default function CreateListing() {
  const router = useRouter();
  const user = useUser();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [locations, setLocations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [mediaPreviewUrls, setMediaPreviewUrls] = useState([]);
  const [primaryMediaIndex, setPrimaryMediaIndex] = useState(0);

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

    async function loadInitialData() {
      try {
        const onboarding = await getOnboardingStatus(user.id);
        if (!onboarding.isComplete) {
          router.replace('/onboarding');
          return;
        }

        // Load profile
        const { profile: profileData, error: profileError } = await getProfile(user.id);
        if (profileError) throw profileError;
        setProfile(profileData);

        // Set default location to profile's primary location
        if (profileData?.primary_location_id) {
          setFormData(prev => ({
            ...prev,
            locationId: profileData.primary_location_id,
          }));
        }

        // Load locations
        const { locations: locationsData, error: locationsError } = await getAllLocations();
        if (locationsError) throw locationsError;
        setLocations(locationsData || []);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load initial data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [user, router]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      mediaPreviewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []); // Empty dependency array - only run on unmount

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

      // Create preview URLs for valid files
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));

      setUploadedMedia(prev => [...prev, ...validFiles]);
      setMediaPreviewUrls(prev => [...prev, ...newPreviewUrls]);

      // Set the first uploaded file as primary if no primary is set
      if (uploadedMedia.length === 0 && validFiles.length > 0) {
        setPrimaryMediaIndex(0);
      }
    }
  };

  const removeMedia = useCallback((index) => {
    // Revoke the object URL to prevent memory leak
    if (mediaPreviewUrls[index]) {
      URL.revokeObjectURL(mediaPreviewUrls[index]);
    }

    setUploadedMedia(prev => prev.filter((_, i) => i !== index));
    setMediaPreviewUrls(prev => prev.filter((_, i) => i !== index));

    // Update primary media index if necessary
    if (primaryMediaIndex === index) {
      setPrimaryMediaIndex(0);
    } else if (primaryMediaIndex > index) {
      setPrimaryMediaIndex(prev => prev - 1);
    }
  }, [mediaPreviewUrls, primaryMediaIndex]);

  const setPrimaryMedia = (index) => {
    setPrimaryMediaIndex(index);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    const validation = validateListingData(formData);
    if (!validation.isValid) {
      setError(validation.errors.join('. '));
      return;
    }

    setError(null);
    setSuccess(false);
    setSubmitting(true);

    try {
      // Sanitize and create the listing
      const { listing, error: createError } = await createListing(user.id, {
        title: sanitizeString(formData.title, 200),
        description: sanitizeString(formData.description, 5000),
        locationId: formData.locationId,
        services: formData.services,
        rates: formData.rates,
      });

      if (createError) throw createError;

      // Upload media files if any
      if (uploadedMedia.length > 0) {
        for (let i = 0; i < uploadedMedia.length; i++) {
          const isPrimary = i === primaryMediaIndex;
          await uploadListingMedia(listing.id, uploadedMedia[i], isPrimary);
        }
      }

      // Charging is disabled for now, so listings go live immediately.
      router.push(`/listings/${listing.id}`);

      setSuccess(true);
    } catch (error) {
      console.error('Error creating listing:', error);
      setError('Failed to create listing. Please try again.');
    } finally {
      setSubmitting(false);
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

  // Check if profile is loaded - allow all users to create listings
  if (!loading && !profile) {
    return (
      <Layout>
        <Head>
          <title>Error | DommeDirectory</title>
        </Head>
        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unable to Load Profile</h1>
          <p className="text-lg text-gray-400 mb-6">
            Please try logging in again.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            Go to Login
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Create Listing | DommeDirectory</title>
        <meta name="description" content="Create a new listing on DommeDirectory" />
      </Head>

      <div className="max-w-5xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-[#1a1a1a] shadow rounded-lg overflow-hidden border border-white/5">
            <div className="px-4 py-5 sm:px-6 bg-[#262626] border-b border-white/5 text-white">
              <h1 className="text-xl font-bold">Create New Listing</h1>
              <p className="mt-1 text-sm text-gray-400">
                Complete the form below to create your listing
              </p>
            </div>

            {error && (
              <div className="px-4 py-3 sm:px-6 bg-red-900/20 text-red-200 border-b border-red-500/30">
                {error}
              </div>
            )}

            {success && (
              <div className="px-4 py-3 sm:px-6 bg-green-900/20 text-green-200 border-b border-green-500/30">
                Listing created successfully!
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h2 className="text-lg font-medium text-white">Basic Information</h2>
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="title" className="block text-sm font-medium text-gray-300">
                      Listing Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full bg-[#262626] border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={5}
                      value={formData.description}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full bg-[#262626] border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="Describe your services, experience, and what clients can expect..."
                    />
                  </div>

                  <div>
                    <label htmlFor="locationId" className="block text-sm font-medium text-gray-300">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="locationId"
                      name="locationId"
                      value={formData.locationId}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full bg-[#262626] border border-white/10 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
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

              {/* Media Upload */}
              <div>
                <h2 className="text-lg font-medium text-white">Photos & Videos</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Upload images to showcase your services. The first image will be your listing&apos;s main image.
                </p>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300">Upload Media</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/10 border-dashed rounded-md hover:border-red-500/50 transition-colors">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-400 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-[#262626] rounded-md font-medium text-red-500 hover:text-red-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-red-500 px-2">
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
                      <div key={index} className={`relative group border border-white/10 rounded-md overflow-hidden ${index === primaryMediaIndex ? 'ring-2 ring-red-500' : ''}`}>
                        <img
                          src={mediaPreviewUrls[index]}
                          alt={`Upload ${index + 1}`}
                          className="h-32 w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setPrimaryMedia(index)}
                            className="p-1 bg-red-600 text-white rounded-full mx-1 hover:bg-red-700"
                            title="Set as primary"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMedia(index)}
                            className="p-1 bg-red-800 text-white rounded-full mx-1 hover:bg-red-900"
                            title="Remove"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        {index === primaryMediaIndex && (
                          <div className="absolute top-0 left-0 bg-red-600 text-white text-xs px-2 py-1">
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
                <h2 className="text-lg font-medium text-white">Services Offered</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Select the services you offer for this listing
                </p>
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
                          className="h-4 w-4 text-red-600 border-gray-600 rounded bg-[#262626] focus:ring-red-500 focus:ring-offset-[#1a1a1a]"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor={`service-${service}`} className="font-medium text-gray-300">
                          {service}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rates */}
              <div>
                <h2 className="text-lg font-medium text-white">Rates</h2>
                <p className="mt-1 text-sm text-gray-400">
                  Set your rates for different session lengths
                </p>

                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 gap-x-4">
                  <div>
                    <label htmlFor="rates.hourly" className="block text-sm font-medium text-gray-300">
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
                        className="mt-1 block w-full bg-[#262626] border border-white/10 pl-7 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rates.twoHour" className="block text-sm font-medium text-gray-300">
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
                        className="mt-1 block w-full bg-[#262626] border border-white/10 pl-7 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rates.halfDay" className="block text-sm font-medium text-gray-300">
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
                        className="mt-1 block w-full bg-[#262626] border border-white/10 pl-7 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rates.fullDay" className="block text-sm font-medium text-gray-300">
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
                        className="mt-1 block w-full bg-[#262626] border border-white/10 pl-7 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
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
                    onClick={() => router.push('/dashboard')}
                    className="bg-[#262626] py-2 px-4 border border-white/10 rounded-md shadow-sm text-sm font-medium text-gray-300 hover:bg-[#333] hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Listing'}
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
