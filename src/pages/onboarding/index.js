import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useUser } from '@supabase/auth-helpers-react';
import { updateProfile, updateProfilePicture } from '../../services/profiles';
import { createListing, uploadListingMedia } from '../../services/listings';
import { getAllLocations } from '../../services/locations';
import { Camera, Check, ChevronRight, Loader2, MapPin, User, Briefcase, Sparkles } from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'profile', title: 'Your Profile', icon: User },
  { id: 'listing', title: 'Create Listing', icon: Briefcase },
  { id: 'complete', title: 'All Done!', icon: Check },
];

export default function Onboarding() {
  const router = useRouter();
  const user = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  
  // Profile data
  const [profileData, setProfileData] = useState({
    display_name: '',
    bio: '',
    primary_location_id: '',
    profile_picture_url: null,
  });
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
    if (!user) {
      router.push('/auth/login');
      return;
    }
    // Pre-fill display name from email
    setProfileData(prev => ({
      ...prev,
      display_name: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
      primary_location_id: user.user_metadata?.primary_location_id || '',
    }));
    fetchLocations();
  }, [user, router]);

  const fetchLocations = async () => {
    const { locations: locs } = await getAllLocations();
    if (locs) setLocations(locs);
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

    setLoading(true);
    
    // Upload profile image if selected
    if (profileImage) {
      const { url, error } = await updateProfilePicture(user.id, profileImage);
      if (error) {
        console.error('Profile image upload error:', error);
      } else {
        profileData.profile_picture_url = url;
      }
    }

    // Save profile data
    const { error } = await updateProfile(user.id, profileData);
    if (error) {
      alert('Failed to save profile: ' + error.message);
      setLoading(false);
      return;
    }

    // Pre-fill listing location
    setListingData(prev => ({ ...prev, locationId: profileData.primary_location_id }));
    
    setLoading(false);
    handleNext();
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
    if (!listingData.title.trim()) {
      alert('Please enter a listing title');
      return;
    }
    if (!listingData.description.trim()) {
      alert('Please enter a description');
      return;
    }
    if (!listingData.locationId) {
      alert('Please select a location');
      return;
    }

    setLoading(true);

    // Create listing
    const { listing, error } = await createListing(user.id, {
      title: listingData.title,
      description: listingData.description,
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
              <p className="text-gray-400">Tell clients about yourself</p>
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
                  rows={4}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 resize-none"
                />
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
              <p className="text-gray-400">Describe your services</p>
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
