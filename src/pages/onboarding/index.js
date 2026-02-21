import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSessionContext, useUser } from '@supabase/auth-helpers-react';
import { getOnboardingStatus, getProfile, updateProfile, updateProfilePicture } from '../../services/profiles';
import { createListing, uploadListingMedia } from '../../services/listings';
import { getAllLocations } from '../../services/locations';
import { Camera, Check, ChevronRight, Loader2, MapPin, User, Briefcase, Sparkles } from 'lucide-react';
import { sanitizeString, validateListingData } from '../../utils/validation';
import { MARKETING_CONSENT_TEXT } from '../../utils/constants';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'profile', title: 'Your Profile', icon: User },
  { id: 'listing', title: 'Create Listing', icon: Briefcase },
  { id: 'complete', title: 'All Done!', icon: Check },
];

const MIN_PROFILE_BIO_LENGTH = 80;
const MIN_LISTING_TITLE_LENGTH = 10;
const MIN_LISTING_DESCRIPTION_LENGTH = 120;

const pushDataLayerEvent = (eventName, payload = {}) => {
  if (typeof window === 'undefined' || !window.dataLayer) return;
  window.dataLayer.push({
    event: eventName,
    ...payload,
  });
};

export default function Onboarding() {
  const router = useRouter();
  const user = useUser();
  const { isLoading: authLoading } = useSessionContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [locations, setLocations] = useState([]);
  const [locationsError, setLocationsError] = useState(null);

  // Profile data
  const [profileData, setProfileData] = useState({
    display_name: '',
    tagline: '',
    bio: '',
    primary_location_id: '',
    service_area_miles: '',
    social_links: { twitter: '', onlyfans: '' },
    profile_picture_url: null,
    marketing_opt_in: false,
    marketing_opt_in_at: null,
  });
  const [faqItems, setFaqItems] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const profileFileInputRef = useRef(null);

  // Listing data
  const [listingData, setListingData] = useState({
    title: '',
    description: '',
    locationId: '',
    services: {},
    rates: { hourly: '', twoHour: '', halfDay: '', fullDay: '' },
  });
  const [listingImages, setListingImages] = useState([]);
  const [listingImagePreviews, setListingImagePreviews] = useState([]);
  const listingFileInputRef = useRef(null);
  const [createdListingId, setCreatedListingId] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth/login?redirect=/onboarding');
      return;
    }

    const initializeOnboarding = async () => {
      setInitializing(true);
      await fetchLocations();

      const { profile } = await getProfile(user.id);
      const onboarding = await getOnboardingStatus(user.id);

      if (onboarding.isComplete) {
        router.replace('/dashboard');
        return;
      }

      const hasProfileBasics = onboarding.hasDisplayName && onboarding.hasPrimaryLocation && onboarding.hasBio;
      const hasPartialProfile = onboarding.hasDisplayName || onboarding.hasPrimaryLocation || onboarding.hasBio;
      if (hasProfileBasics && !onboarding.hasDetailedListing) {
        setCurrentStep(2);
      } else if (hasPartialProfile) {
        setCurrentStep(1);
      }

      setProfileData((prev) => ({
        ...prev,
        display_name: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || '',
        tagline: profile?.tagline || '',
        bio: profile?.bio || '',
        primary_location_id: profile?.primary_location_id || user.user_metadata?.primary_location_id || '',
        service_area_miles: profile?.service_area_miles ? String(profile.service_area_miles) : '',
        social_links: {
          twitter: profile?.social_links?.twitter || '',
          onlyfans: profile?.social_links?.onlyfans || '',
        },
        profile_picture_url: profile?.profile_picture_url || null,
        marketing_opt_in: Boolean(profile?.marketing_opt_in ?? user.user_metadata?.marketing_opt_in),
        marketing_opt_in_at:
          profile?.marketing_opt_in_at ||
          user.user_metadata?.marketing_opt_in_at ||
          null,
      }));

      if (Array.isArray(profile?.faq) && profile.faq.length > 0) {
        setFaqItems(profile.faq);
      }

      if (profile?.primary_location_id) {
        setListingData((prev) => ({ ...prev, locationId: profile.primary_location_id }));
      }

      setInitializing(false);
    };

    initializeOnboarding();
  }, [authLoading, user, router]);

  useEffect(() => {
    const step = STEPS[currentStep];
    if (!step) return;

    pushDataLayerEvent('onboarding_step_view', {
      onboarding_step_id: step.id,
      onboarding_step_index: currentStep + 1,
    });
  }, [currentStep]);

  const fetchLocations = async () => {
    setLocationsError(null);
    const { locations: locs, error } = await getAllLocations();
    if (error || !locs) {
      setLocations([]);
      setLocationsError('Unable to load locations right now. Please retry.');
      return;
    }
    setLocations(locs);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Profile Step
  const handleProfileImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }
    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!profileData.display_name.trim()) {
      alert('Please enter a display name');
      return;
    }
    if (!profileData.primary_location_id) {
      alert('Please select your location');
      return;
    }
    if (profileData.bio.trim().length < MIN_PROFILE_BIO_LENGTH) {
      alert(`Please add at least ${MIN_PROFILE_BIO_LENGTH} characters to your bio so your profile has enough unique content.`);
      return;
    }

    setLoading(true);

    try {
      const sanitizedBio = sanitizeString(profileData.bio || '', 50000);
      const marketingOptIn = Boolean(profileData.marketing_opt_in);
      const marketingOptInAt = marketingOptIn
        ? new Date().toISOString()
        : null;
      const validFaq = faqItems.filter((f) => f.question.trim() && f.answer.trim());
      const payload = {
        ...profileData,
        display_name: sanitizeString(profileData.display_name, 100),
        tagline: sanitizeString(profileData.tagline || '', 200),
        bio: sanitizedBio,
        service_area_miles: profileData.service_area_miles ? Number(profileData.service_area_miles) : null,
        social_links: {
          twitter: profileData.social_links.twitter.trim(),
          onlyfans: profileData.social_links.onlyfans.trim(),
        },
        faq: validFaq,
        marketing_opt_in: marketingOptIn,
        marketing_opt_in_at: marketingOptInAt,
      };

      // Upload profile image if selected
      if (profileImage) {
        const { url, error } = await updateProfilePicture(user.id, profileImage);
        if (error) {
          console.error('Profile image upload error:', error);
          alert('Profile photo upload failed. You can retry later from Profile settings.');
        } else {
          payload.profile_picture_url = url;
        }
      }

      // Save profile data
      const { error } = await updateProfile(user.id, payload);
      if (error) {
        alert('Failed to save profile: ' + error.message);
        setLoading(false);
        return;
      }

      // Pre-fill listing location
      setListingData(prev => ({ ...prev, locationId: payload.primary_location_id }));

      pushDataLayerEvent('onboarding_profile_saved', {
        has_profile_photo: Boolean(payload.profile_picture_url),
        bio_length: payload.bio.length,
        marketing_opt_in: Boolean(payload.marketing_opt_in),
      });

      setLoading(false);
      handleNext();
    } catch (err) {
      console.error('Save profile error:', err);
      alert('Failed to save profile. Please try again.');
      setLoading(false);
    }
  };

  // Listing Step
  const handleListingImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file =>
      file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Images must be under 5MB.');
    }

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setListingImages(prev => [...prev, ...validFiles]);
    setListingImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeListingImage = (index) => {
    setListingImages(prev => prev.filter((_, i) => i !== index));
    setListingImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const toggleService = (service) => {
    setListingData(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [service]: !prev.services[service]
      }
    }));
  };

  const saveListing = async () => {
    if (listingData.title.trim().length < MIN_LISTING_TITLE_LENGTH) {
      alert(`Please use at least ${MIN_LISTING_TITLE_LENGTH} characters in your listing title.`);
      return;
    }

    if (listingData.description.trim().length < MIN_LISTING_DESCRIPTION_LENGTH) {
      alert(`Please write at least ${MIN_LISTING_DESCRIPTION_LENGTH} characters in your listing description for stronger SEO.`);
      return;
    }

    const selectedServices = Object.values(listingData.services || {}).filter(Boolean).length;
    if (selectedServices === 0) {
      alert('Please select at least one service to describe what you offer.');
      return;
    }

    const validation = validateListingData(listingData);
    if (!validation.isValid) {
      alert(validation.errors.join('. '));
      return;
    }

    setLoading(true);

    // Create listing
    const { listing, error } = await createListing(user.id, {
      title: sanitizeString(listingData.title, 200),
      description: sanitizeString(listingData.description, 5000),
      locationId: listingData.locationId,
      services: listingData.services,
      rates: listingData.rates,
    });

    if (error || !listing) {
      alert('Failed to create listing: ' + (error?.message || 'Unknown error'));
      setLoading(false);
      return;
    }

    // Upload listing images
    if (listingImages.length > 0) {
      for (let i = 0; i < listingImages.length; i++) {
        const isPrimary = i === 0;
        const { error: uploadError } = await uploadListingMedia(
          listing.id,
          listingImages[i],
          isPrimary
        );
        if (uploadError) {
          console.error('Image upload error:', uploadError);
        }
      }
    }

    setCreatedListingId(listing.id);
    pushDataLayerEvent('onboarding_listing_created', {
      listing_id: listing.id,
      listing_images_count: listingImages.length,
      listing_description_length: listingData.description.trim().length,
      selected_services_count: Object.values(listingData.services || {}).filter(Boolean).length,
    });
    setLoading(false);
    handleNext();
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  const goToListing = () => {
    if (createdListingId) {
      router.push(`/listings/${createdListingId}`);
    }
  };

  if (authLoading || initializing) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Head>
        <title>Welcome to DommeDirectory</title>
      </Head>

      {/* Header */}
      <header className="bg-[#111] border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-white font-black text-xl tracking-tight">
            DOMME<span className="text-red-600">DIR</span>
          </Link>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-[#0d0d0d] border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-full transition-colors
                    ${isActive ? 'bg-red-600 text-white' : ''}
                    ${isCompleted ? 'text-green-500' : 'text-gray-500'}
                  `}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">{step.title}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-600 mx-2" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 0: Welcome */}
        {currentStep === 0 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Welcome to DommeDirectory!
            </h1>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              Let&apos;s set up your profile and create your first listing. This will only take a few minutes.
            </p>
            <div className="space-y-3 max-w-sm mx-auto pt-4">
              <div className="flex items-center gap-3 text-gray-300 bg-[#1a1a1a] p-4 rounded-lg">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
                <span>Set up your profile</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300 bg-[#1a1a1a] p-4 rounded-lg">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                <span>Create your first listing</span>
              </div>
              <div className="flex items-center gap-3 text-gray-300 bg-[#1a1a1a] p-4 rounded-lg">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                <span>Start getting clients!</span>
              </div>
            </div>
            <button
              onClick={handleNext}
              className="mt-8 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Get Started
            </button>
          </div>
        )}

        {/* Step 1: Profile */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Set Up Your Profile</h2>
              <p className="text-gray-400">Add detailed, unique profile information clients can trust</p>
            </div>

            {/* Profile Photo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div
                  className="w-32 h-32 rounded-full bg-[#1a1a1a] border-2 border-gray-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-red-600 transition-colors"
                  onClick={() => profileFileInputRef.current?.click()}
                >
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-gray-600" />
                  )}
                </div>
                <button
                  onClick={() => profileFileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  ref={profileFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageSelect}
                  className="hidden"
                />
              </div>
            </div>
            <p className="text-center text-gray-500 text-sm">Click to add profile photo</p>

            {locationsError && (
              <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-center">
                <p className="text-red-200 text-sm mb-2">{locationsError}</p>
                <button
                  type="button"
                  onClick={fetchLocations}
                  className="text-sm text-red-400 hover:text-red-300 underline"
                >
                  Retry loading locations
                </button>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={profileData.display_name}
                  onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                  placeholder="Your professional name"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Headline <span className="text-gray-500 font-normal">(optional — used in search results)</span>
                </label>
                <input
                  type="text"
                  value={profileData.tagline}
                  onChange={(e) => setProfileData({ ...profileData, tagline: e.target.value })}
                  placeholder="e.g. London-based lifestyle dominatrix specialising in financial domination"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                  maxLength={200}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {profileData.tagline.length}/200 — appears as your Google search snippet
                </p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location *
                </label>
                <select
                  value={profileData.primary_location_id}
                  onChange={(e) => setProfileData({ ...profileData, primary_location_id: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
                >
                  <option value="">Select your city</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.city}, {loc.state}, {loc.country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell clients about yourself, your experience, and your style..."
                  rows={8}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 resize-y"
                />
                <p className={`mt-2 text-xs ${profileData.bio.trim().length >= MIN_PROFILE_BIO_LENGTH ? 'text-green-400' : 'text-gray-500'}`}>
                  {profileData.bio.trim().length} characters — minimum {MIN_PROFILE_BIO_LENGTH} for ranking
                </p>
              </div>

              {/* Social links */}
              <div className="space-y-3">
                <label className="block text-gray-300 text-sm font-medium">
                  Social Profiles <span className="text-gray-500 font-normal">(optional — helps with search rankings)</span>
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-24 shrink-0">Twitter / X</span>
                  <input
                    type="text"
                    value={profileData.social_links.twitter}
                    onChange={(e) => setProfileData({ ...profileData, social_links: { ...profileData.social_links, twitter: e.target.value } })}
                    placeholder="@yourhandle or full URL"
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 text-sm"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-24 shrink-0">OnlyFans</span>
                  <input
                    type="text"
                    value={profileData.social_links.onlyfans}
                    onChange={(e) => setProfileData({ ...profileData, social_links: { ...profileData.social_links, onlyfans: e.target.value } })}
                    placeholder="onlyfans.com/yourname or @handle"
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 text-sm"
                  />
                </div>
              </div>

              {/* Service area */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  How far can you travel? <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <select
                  value={profileData.service_area_miles}
                  onChange={(e) => setProfileData({ ...profileData, service_area_miles: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
                >
                  <option value="">Local only / not specified</option>
                  <option value="10">Up to 10 miles</option>
                  <option value="25">Up to 25 miles</option>
                  <option value="50">Up to 50 miles</option>
                  <option value="100">Up to 100 miles</option>
                  <option value="999">Available to travel nationally</option>
                </select>
              </div>

              {/* FAQ */}
              <div className="space-y-3">
                <label className="block text-gray-300 text-sm font-medium">
                  FAQ <span className="text-gray-500 font-normal">(optional — boosts search appearance)</span>
                </label>
                <p className="text-xs text-gray-500">
                  Add common client questions. These show as expandable answers directly in Google search results.
                </p>
                {faqItems.map((item, index) => (
                  <div key={index} className="bg-[#111] border border-gray-800 rounded-lg p-4 space-y-2">
                    <input
                      type="text"
                      value={item.question}
                      onChange={(e) => {
                        const updated = [...faqItems];
                        updated[index] = { ...updated[index], question: e.target.value };
                        setFaqItems(updated);
                      }}
                      placeholder={`Question ${index + 1} — e.g. Do you offer sessions outside London?`}
                      className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 text-sm"
                    />
                    <textarea
                      value={item.answer}
                      onChange={(e) => {
                        const updated = [...faqItems];
                        updated[index] = { ...updated[index], answer: e.target.value };
                        setFaqItems(updated);
                      }}
                      placeholder="Your answer..."
                      rows={2}
                      className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 text-sm resize-none"
                    />
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-gray-700 bg-[#151515] px-3 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(profileData.marketing_opt_in)}
                  onChange={(e) => setProfileData({
                    ...profileData,
                    marketing_opt_in: e.target.checked,
                  })}
                  className="mt-1 h-4 w-4 rounded border-gray-500 bg-[#222] text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-300">
                  {MARKETING_CONSENT_TEXT}
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={saveProfile}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                ) : (
                  <>Continue <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Listing */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">Create Your First Listing</h2>
              <p className="text-gray-400">Write a detailed listing clients and search engines can understand</p>
            </div>

            {/* Listing Photos */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-3">
                Photos ({listingImages.length} selected)
              </label>
              <div className="grid grid-cols-4 gap-3">
                {listingImagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeListingImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full text-white text-xs hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => listingFileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center text-gray-500 hover:border-red-600 hover:text-red-600 transition-colors"
                >
                  <Camera className="w-6 h-6" />
                </button>
                <input
                  ref={listingFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleListingImageSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Listing Details */}
            <div className="space-y-4">
              {locationsError && (
                <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-center">
                  <p className="text-red-200 text-sm mb-2">{locationsError}</p>
                  <button
                    type="button"
                    onClick={fetchLocations}
                    className="text-sm text-red-400 hover:text-red-300 underline"
                  >
                    Retry loading locations
                  </button>
                </div>
              )}

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Listing Title *
                </label>
                <input
                  type="text"
                  value={listingData.title}
                  onChange={(e) => setListingData({ ...listingData, title: e.target.value })}
                  placeholder="e.g., Professional Domme - BDSM Sessions"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  value={listingData.description}
                  onChange={(e) => setListingData({ ...listingData, description: e.target.value })}
                  placeholder="Describe your services, experience, and what clients can expect..."
                  rows={4}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 resize-none"
                />
                <p className={`mt-2 text-xs ${listingData.description.trim().length >= MIN_LISTING_DESCRIPTION_LENGTH ? 'text-green-400' : 'text-gray-500'}`}>
                  {listingData.description.trim().length}/{MIN_LISTING_DESCRIPTION_LENGTH}+ characters minimum for onboarding completion
                </p>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Listing Location *
                </label>
                <select
                  value={listingData.locationId}
                  onChange={(e) => setListingData({ ...listingData, locationId: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
                >
                  <option value="">Select city</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.city}, {loc.state}, {loc.country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Services */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-3">
                  Services Offered
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Bondage', 'Discipline', 'Domination', 'Submission', 'Sadism', 'Masochism', 'Roleplay', 'Fetish', 'CBT', 'Spanking', 'Humiliation', 'Foot Worship', 'Pegging', 'Financial Domination', 'Sissy Training'].map((service) => (
                    <button
                      key={service}
                      onClick={() => toggleService(service)}
                      className={`
                        px-3 py-1.5 rounded-full text-sm transition-colors
                        ${listingData.services[service]
                          ? 'bg-red-600 text-white'
                          : 'bg-[#1a1a1a] text-gray-400 border border-gray-700 hover:border-gray-600'}
                      `}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rates */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-3">
                  Rates (optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'hourly', label: 'Hourly' },
                    { key: 'twoHour', label: '2 Hours' },
                    { key: 'halfDay', label: 'Half Day' },
                    { key: 'fullDay', label: 'Full Day' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-gray-500 text-xs mb-1">{label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="text"
                          value={listingData.rates[key]}
                          onChange={(e) => setListingData({
                            ...listingData,
                            rates: { ...listingData.rates, [key]: e.target.value }
                          })}
                          placeholder="0"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-red-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={saveListing}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</>
                ) : (
                  <>Create Listing <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {currentStep === 3 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-white">
              You&apos;re All Set!
            </h2>
            <p className="text-gray-400 text-lg max-w-md mx-auto">
              Your profile and listing have been created. You can now start receiving inquiries from clients.
            </p>

            <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-sm mx-auto">
              <h3 className="text-white font-semibold mb-4">What&apos;s next?</h3>
              <ul className="text-left text-gray-400 space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Your listing is now live and searchable</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Clients can find you by location</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>You can edit your listing anytime</span>
                </li>
              </ul>
              <div className="mt-5 pt-5 border-t border-gray-800">
                <p className="text-sm font-semibold text-yellow-500 mb-2">Want to rank #1?</p>
                <p className="text-xs text-gray-400">Invite a fellow provider using the referral link in your dashboard. You both instantly unlock 7 days of Premium Featured Placement.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto pt-4">
              <button
                onClick={goToDashboard}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={goToListing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium transition-colors"
              >
                View My Listing
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
