import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useSessionContext, useUser } from '@supabase/auth-helpers-react';
import { getOnboardingStatus, getProfile, updateProfile, updateProfilePicture } from '../../services/profiles';
import { createListing, uploadListingMedia } from '../../services/listings';
import { getAllLocations } from '../../services/locations';
import { Camera, Check, ChevronRight, Loader2, MapPin, User, Briefcase, AlertCircle, ImageIcon, Globe, Clock, Link2 } from 'lucide-react';
import { sanitizeString, validateListingData } from '../../utils/validation';
import { calculateCompleteness } from '../../utils/completeness';

const COMMON_LANGUAGES = [
  'English', 'French', 'Spanish', 'Mandarin', 'Cantonese', 'Portuguese',
  'German', 'Italian', 'Japanese', 'Korean', 'Russian', 'Arabic',
  'Hindi', 'Dutch', 'Polish', 'Turkish', 'Vietnamese', 'Thai',
];

const SESSION_FORMAT_OPTIONS = [
  { key: 'incall', label: 'Incall', desc: 'Clients visit you' },
  { key: 'outcall', label: 'Outcall', desc: 'You travel to clients' },
  { key: 'virtual', label: 'Virtual', desc: 'Online sessions' },
];

const STEPS = [
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

function InlineError({ message }) {
  if (!message) return null;
  return (
    <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-red-200 text-sm">{message}</p>
    </div>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const user = useUser();
  const { isLoading: authLoading } = useSessionContext();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [locations, setLocations] = useState([]);
  const [locationsError, setLocationsError] = useState(null);
  const [error, setError] = useState(null);

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
    experience_years: '',
    languages: [],
    booking_link: '',
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
    session_formats: {},
    accepts_beginners: null,
  });
  const [listingImages, setListingImages] = useState([]);
  const [listingImagePreviews, setListingImagePreviews] = useState([]);
  const listingFileInputRef = useRef(null);
  const [createdListingId, setCreatedListingId] = useState(null);
  const [uploadedListingMediaCount, setUploadedListingMediaCount] = useState(0);

  // Image upload tracking
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total, failed }

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
        setCurrentStep(1);
      } else if (hasPartialProfile) {
        setCurrentStep(0);
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
        experience_years: profile?.experience_years != null ? String(profile.experience_years) : '',
        languages: Array.isArray(profile?.languages) ? profile.languages : [],
        booking_link: profile?.booking_link || '',
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
    setError(null);
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Profile Step
  const handleProfileImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB.');
      return;
    }
    setError(null);
    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    setError(null);

    if (!profileData.display_name.trim()) {
      setError('Please enter a display name.');
      return;
    }
    if (!profileData.primary_location_id) {
      setError('Please select your location.');
      return;
    }
    if (profileData.bio.trim().length < MIN_PROFILE_BIO_LENGTH) {
      setError(`Your bio needs at least ${MIN_PROFILE_BIO_LENGTH} characters so your profile has enough unique content. You have ${profileData.bio.trim().length} so far.`);
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
        experience_years: profileData.experience_years ? Number(profileData.experience_years) : null,
        languages: profileData.languages.length > 0 ? profileData.languages : [],
        booking_link: profileData.booking_link.trim() || null,
      };

      // Upload profile image if selected
      if (profileImage) {
        const { url, error: uploadErr } = await updateProfilePicture(user.id, profileImage);
        if (uploadErr) {
          console.error('Profile image upload error:', uploadErr);
          setError('Profile photo upload failed. Your profile will be saved without it — you can add a photo later from Profile settings.');
        } else {
          payload.profile_picture_url = url;
        }
      }

      // Save profile data
      const { error: saveErr } = await updateProfile(user.id, payload);
      if (saveErr) {
        setError('Failed to save profile: ' + saveErr.message);
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
      setError('Failed to save profile. Please try again.');
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
      const skipped = files.length - validFiles.length;
      setError(`${skipped} file${skipped > 1 ? 's were' : ' was'} skipped — images must be under 5MB.`);
    } else {
      setError(null);
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
    setError(null);
    setUploadedListingMediaCount(0);

    if (listingData.title.trim().length < MIN_LISTING_TITLE_LENGTH) {
      setError(`Listing title needs at least ${MIN_LISTING_TITLE_LENGTH} characters.`);
      return;
    }

    if (listingData.description.trim().length < MIN_LISTING_DESCRIPTION_LENGTH) {
      setError(`Listing description needs at least ${MIN_LISTING_DESCRIPTION_LENGTH} characters for strong SEO. You have ${listingData.description.trim().length} so far.`);
      return;
    }

    const selectedServices = Object.values(listingData.services || {}).filter(Boolean).length;
    if (selectedServices === 0) {
      setError('Please select at least one service to describe what you offer.');
      return;
    }

    if (!listingData.locationId) {
      setError('Please select a location for your listing.');
      return;
    }

    const validation = validateListingData(listingData);
    if (!validation.isValid) {
      setError(validation.errors.join('. '));
      return;
    }

    setLoading(true);

    // Create listing
    const { listing, error: createErr } = await createListing(user.id, {
      title: sanitizeString(listingData.title, 200),
      description: sanitizeString(listingData.description, 5000),
      locationId: listingData.locationId,
      services: listingData.services,
      rates: listingData.rates,
      session_formats: listingData.session_formats,
      accepts_beginners: listingData.accepts_beginners,
    });

    if (createErr || !listing) {
      setError('Failed to create listing: ' + (createErr?.message || 'Unknown error. Please try again.'));
      setLoading(false);
      return;
    }

    // Upload listing images with progress tracking
    let failedUploads = 0;
    if (listingImages.length > 0) {
      setUploadProgress({ current: 0, total: listingImages.length, failed: 0 });
      for (let i = 0; i < listingImages.length; i++) {
        const isPrimary = i === 0;
        const { error: uploadError } = await uploadListingMedia(
          listing.id,
          listingImages[i],
          isPrimary
        );
        if (uploadError) {
          console.error('Image upload error:', uploadError);
          failedUploads++;
        }
        setUploadProgress({ current: i + 1, total: listingImages.length, failed: failedUploads });
      }
    }
    const successfulUploads = Math.max(0, listingImages.length - failedUploads);
    setUploadedListingMediaCount(successfulUploads);

    setCreatedListingId(listing.id);

    // Persist completeness score so ranking works immediately
    const completenessProfile = {
      ...profileData,
      social_links: profileData.social_links,
      faq: faqItems.filter(f => f.question.trim() && f.answer.trim()),
    };
    const completenessListing = {
      title: listingData.title,
      description: listingData.description,
      services: listingData.services,
      rates: listingData.rates,
      session_formats: listingData.session_formats,
      accepts_beginners: listingData.accepts_beginners,
    };
    const completenessMedia = Array.from({ length: successfulUploads }, () => ({}));
    const { score } = calculateCompleteness(completenessProfile, [completenessListing], completenessMedia);
    updateProfile(user.id, { completeness_score: score }).catch(() => {});

    pushDataLayerEvent('onboarding_listing_created', {
      listing_id: listing.id,
      listing_images_count: listingImages.length,
      listing_images_failed: failedUploads,
      listing_description_length: listingData.description.trim().length,
      selected_services_count: Object.values(listingData.services || {}).filter(Boolean).length,
    });
    setUploadProgress(null);
    setLoading(false);

    if (failedUploads > 0 && failedUploads < listingImages.length) {
      setError(`${failedUploads} photo${failedUploads > 1 ? 's' : ''} failed to upload. You can re-upload them from your dashboard.`);
      // Still proceed after a brief delay so they can read the message
      setTimeout(() => {
        setError(null);
        handleNext();
      }, 3000);
    } else if (failedUploads > 0 && failedUploads === listingImages.length) {
      setError('All photo uploads failed. Your listing was created without photos — you can add them from your dashboard.');
      setTimeout(() => {
        setError(null);
        handleNext();
      }, 3000);
    } else {
      handleNext();
    }
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
        <title>Set Up Your Profile — DommeDirectory</title>
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
        {/* Step 0: Profile */}
        {currentStep === 0 && (
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
                  Bio *
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell clients about yourself, your experience, and your style..."
                  rows={8}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 resize-y"
                />
                <p className={`mt-2 text-xs ${profileData.bio.trim().length >= MIN_PROFILE_BIO_LENGTH ? 'text-green-400' : 'text-gray-500'}`}>
                  {profileData.bio.trim().length}/{MIN_PROFILE_BIO_LENGTH} characters minimum
                </p>
              </div>

              {/* Social links */}
              <div className="space-y-3">
                <label className="block text-gray-300 text-sm font-medium">
                  Social Profiles <span className="text-gray-500 font-normal">(optional)</span>
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

              {/* Experience */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Years of Experience <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <select
                  value={profileData.experience_years}
                  onChange={(e) => setProfileData({ ...profileData, experience_years: e.target.value })}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-600"
                >
                  <option value="">Prefer not to say</option>
                  <option value="1">Less than 1 year</option>
                  <option value="2">1–2 years</option>
                  <option value="3">3–5 years</option>
                  <option value="5">5–10 years</option>
                  <option value="10">10–15 years</option>
                  <option value="15">15+ years</option>
                </select>
              </div>

              {/* Languages */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Languages Spoken <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setProfileData(prev => ({
                          ...prev,
                          languages: prev.languages.includes(lang)
                            ? prev.languages.filter(l => l !== lang)
                            : [...prev.languages, lang],
                        }));
                      }}
                      className={`
                        px-3 py-1.5 rounded-full text-sm transition-colors
                        ${profileData.languages.includes(lang)
                          ? 'bg-red-600 text-white'
                          : 'bg-[#1a1a1a] text-gray-400 border border-gray-700 hover:border-gray-600'}
                      `}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking link */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  <Link2 className="w-4 h-4 inline mr-1" />
                  Booking Link <span className="text-gray-500 font-normal">(optional — where clients book you)</span>
                </label>
                <input
                  type="url"
                  value={profileData.booking_link}
                  onChange={(e) => setProfileData({ ...profileData, booking_link: e.target.value })}
                  placeholder="https://calendly.com/yourname or your booking page"
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 text-sm"
                />
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
            </div>

            <InlineError message={error} />

            {/* Actions */}
            <div className="pt-4">
              <button
                onClick={saveProfile}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
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

        {/* Step 1: Listing */}
        {currentStep === 1 && (
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
                  {listingData.description.trim().length}/{MIN_LISTING_DESCRIPTION_LENGTH} characters minimum
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
                  Services Offered *
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

              {/* Session Formats */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-3">
                  Session Format <span className="text-gray-500 font-normal">(select all that apply)</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {SESSION_FORMAT_OPTIONS.map(({ key, label, desc }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setListingData(prev => ({
                        ...prev,
                        session_formats: {
                          ...prev.session_formats,
                          [key]: !prev.session_formats[key],
                        }
                      }))}
                      className={`
                        p-3 rounded-lg text-center transition-colors border
                        ${listingData.session_formats[key]
                          ? 'bg-red-600/20 border-red-600 text-white'
                          : 'bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600'}
                      `}
                    >
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Beginner Friendly */}
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-3">
                  Do you accept beginners? <span className="text-gray-500 font-normal">(helps new clients find you)</span>
                </label>
                <div className="flex gap-3">
                  {[
                    { value: true, label: 'Yes, beginners welcome' },
                    { value: false, label: 'Experienced clients only' },
                  ].map(({ value, label }) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => setListingData(prev => ({
                        ...prev,
                        accepts_beginners: prev.accepts_beginners === value ? null : value,
                      }))}
                      className={`
                        flex-1 px-4 py-2.5 rounded-lg text-sm transition-colors border
                        ${listingData.accepts_beginners === value
                          ? 'bg-red-600/20 border-red-600 text-white'
                          : 'bg-[#1a1a1a] border-gray-700 text-gray-400 hover:border-gray-600'}
                      `}
                    >
                      {label}
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
                          type="number"
                          min="0"
                          max="100000"
                          step="1"
                          value={listingData.rates[key]}
                          onChange={(e) => setListingData({
                            ...listingData,
                            rates: { ...listingData.rates, [key]: e.target.value }
                          })}
                          placeholder="0"
                          className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <InlineError message={error} />

            {/* Upload progress */}
            {uploadProgress && (
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <ImageIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    Uploading photo {uploadProgress.current} of {uploadProgress.total}...
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
                {uploadProgress.failed > 0 && (
                  <p className="text-xs text-yellow-400 mt-2">
                    {uploadProgress.failed} failed so far — you can re-upload from your dashboard
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleBack}
                disabled={loading}
                className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={saveListing}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> {uploadProgress ? 'Uploading...' : 'Creating...'}</>
                ) : (
                  <>Create Listing <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Complete */}
        {currentStep === 2 && (() => {
          // Calculate completeness based on what was just saved
          const mockProfile = {
            ...profileData,
            social_links: profileData.social_links,
            faq: faqItems.filter(f => f.question.trim() && f.answer.trim()),
          };
          const mockListing = {
            title: listingData.title,
            description: listingData.description,
            services: listingData.services,
            rates: listingData.rates,
            session_formats: listingData.session_formats,
            accepts_beginners: listingData.accepts_beginners,
          };
          const uploadedMedia = Array.from({ length: uploadedListingMediaCount }, () => ({}));
          const { score, missing } = calculateCompleteness(mockProfile, [mockListing], uploadedMedia);
          const topMissing = missing.slice(0, 3);

          return (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-white">
                You&apos;re All Set!
              </h2>
              <p className="text-gray-400 text-lg max-w-md mx-auto">
                Your profile and listing are live. Clients can find you now.
              </p>

              {/* Completeness Score */}
              <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-sm mx-auto">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold">Profile Strength</h3>
                  <span className={`text-lg font-bold ${score >= 80 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {score}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                {score < 80 && topMissing.length > 0 && (
                  <div className="text-left space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Complete these for higher ranking:</p>
                    {topMissing.map((field) => (
                      <div key={field.key} className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 flex-shrink-0" />
                        <span>Add {field.label.toLowerCase()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {score >= 80 && (
                  <p className="text-sm text-green-400">Your profile is in great shape for ranking.</p>
                )}

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
          );
        })()}
      </main>
    </div>
  );
}
