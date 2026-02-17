import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import SEO, { generateListingSchema, generateProfilePageSchema } from '../../components/ui/SEO';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../utils/supabase';
import { getListingReviews, getListingRating, createReview } from '../../services/reviews';
import { ReviewCard, ReviewForm } from '../../components/ui/ReviewCard';
import { MessageSquare, Loader2, Star } from 'lucide-react';

// Star Rating Component
function StarRating({ rating, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className={`${sizeClass} ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// Photo Lightbox Component
function PhotoLightbox({ photos, initialIndex, isOpen, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  if (!isOpen || !photos || photos.length === 0) return null;

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setZoom(1);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setZoom(1);
  };

  const toggleZoom = () => setZoom(zoom === 1 ? 2 : 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white z-10 p-2">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-2">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
        <img
          src={photos[currentIndex]?.url}
          alt=""
          className="max-w-full max-h-full object-contain cursor-zoom-in transition-transform duration-300"
          style={{ transform: `scale(${zoom})` }}
          onClick={toggleZoom}
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
          {currentIndex + 1} / {photos.length}
        </div>
        <div className="absolute bottom-4 right-4 text-white/50 text-xs">
          Click to {zoom === 1 ? 'zoom' : 'reset'}
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const { id } = context.params;

  try {
    // Fetch listing with all related data
    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles!inner(
          id, display_name, bio, is_verified, profile_picture_url,
          contact_email, contact_phone, website, social_links,
          services_offered, created_at
        ),
        locations!inner(id, city, state, country),
        media(id, storage_path, is_primary)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { notFound: true };
      }
      throw error;
    }

    if (!listing) {
      return { notFound: true };
    }

    // Fetch similar listings from the same location
    let similarListings = [];
    if (listing.location_id) {
      const { data: similar } = await supabase
        .from('listings')
        .select(`
          id, title,
          profiles!inner(id, display_name, profile_picture_url),
          locations!inner(id, city, country)
        `)
        .eq('location_id', listing.location_id)
        .eq('is_active', true)
        .neq('id', id)
        .limit(4);

      similarListings = similar || [];
    }

    return {
      props: {
        listing,
        similarListings,
        error: null,
      },
    };
  } catch (error) {
    console.error('Error fetching listing:', error);
    return {
      props: {
        listing: null,
        similarListings: [],
        error: 'Failed to load listing data',
      },
    };
  }
}

export default function ProfileDetail({ listing, similarListings, error: serverError }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('about');
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Fetch reviews when tab is selected
  useEffect(() => {
    if (activeTab === 'reviews' && listing?.id) {
      fetchReviews();
    }
  }, [activeTab, listing?.id]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      setCurrentUserId(data?.user?.id || null);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
      const [{ reviews: data }, { average, count }] = await Promise.all([
        getListingReviews(listing.id, { limit: 20 }),
        getListingRating(listing.id)
      ]);
      setReviews(data);
      setAverageRating(average);
      setReviewCount(count);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async (reviewData) => {
    if (!currentUserId) {
      return { error: 'Please log in to submit a review.' };
    }

    const { review, error } = await createReview(reviewData);
    if (error) {
      return { error: error.message };
    }
    await fetchReviews();
    showToast('Review submitted successfully!', 'success');
    return { review };
  };

  // Handle error state
  if (serverError || !listing) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Listing Not Found</h2>
          <p className="text-gray-400 mb-6">{serverError || 'This listing may have been removed or is no longer available.'}</p>
          <Link href="/cities" className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors">
            Browse All Listings
          </Link>
        </div>
      </Layout>
    );
  }

  // Extract data from the listing
  const profile = listing.profiles || {};
  const location = listing.locations || {};
  const mediaItems = listing.media || [];

  // Build photos array from media
  const primaryMedia = mediaItems.find(m => m.is_primary);
  const photos = mediaItems.length > 0
    ? mediaItems
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      .map((m, i) => ({ id: m.id, url: m.storage_path, type: i === 0 ? 'main' : 'gallery' }))
    : [{ id: 'default', url: profile.profile_picture_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=1500&fit=crop', type: 'main' }];

  // Build display data
  const displayName = profile.display_name || listing.title || 'Unknown';
  const locationStr = `${location.city || ''}${location.state ? ', ' + location.state : ''}${location.country ? ', ' + location.country : ''}`;
  const memberSince = profile.created_at ? new Date(profile.created_at).getFullYear() : 'N/A';

  // Parse services from listing JSON
  const services = listing.services || {};
  const servicesArray = Object.entries(services).map(([name, included]) => ({
    name,
    included: !!included,
  }));

  // Parse rates from listing JSON
  const rates = listing.rates || {};
  const ratesEntries = Object.entries(rates);

  // Social links
  const socialLinks = profile.social_links || {};

  const handleSave = () => {
    setSaved(!saved);
    showToast(saved ? 'Removed from favorites' : 'Added to favorites', 'success');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard', 'success');
  };

  const handleReport = () => {
    setShowReportModal(false);
    showToast('Report submitted. Thank you for keeping our community safe.', 'success');
  };

  return (
    <Layout>
      <SEO
        title={`${displayName} - ${locationStr} | DommeDirectory`}
        description={listing.description?.substring(0, 160) || `View ${displayName}'s profile on DommeDirectory`}
        canonical={`https://dommedirectory.com/listings/${listing.id}`}
        jsonLd={[generateListingSchema(listing), generateProfilePageSchema(listing)]}
      />

      {/* Lightbox */}
      <PhotoLightbox
        photos={photos}
        initialIndex={activeImage}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-white text-lg font-semibold mb-4">Report Profile</h3>
            <p className="text-gray-400 text-sm mb-4">Please select a reason for reporting this profile:</p>
            <div className="space-y-2 mb-4">
              {['Fake photos', 'Inappropriate content', 'Scam or fraud', 'Safety concern', 'Other'].map(reason => (
                <label key={reason} className="flex items-center gap-2 text-gray-300 cursor-pointer">
                  <input type="radio" name="report" className="text-red-600" />
                  {reason}
                </label>
              ))}
            </div>
            <textarea className="w-full bg-gray-700 text-white rounded p-3 mb-4 text-sm" rows={3} placeholder="Additional details (optional)" />
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowReportModal(false)}>Cancel</Button>
              <Button fullWidth onClick={handleReport}>Submit Report</Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0a0a0a] min-h-screen">
        {/* Photo Gallery */}
        <div className="bg-black">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
              {/* Main Image */}
              <div
                className="relative aspect-[4/5] lg:aspect-auto lg:h-[600px] cursor-pointer group"
                onClick={() => setLightboxOpen(true)}
              >
                <img src={photos[activeImage]?.url} alt={displayName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <div className="absolute top-4 left-4 flex gap-2">
                  {profile.is_verified && <Badge variant="verified">Verified</Badge>}
                  {listing.is_featured && <Badge variant="primary">Featured</Badge>}
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/70 text-white text-xs px-3 py-1 rounded-full">Click to expand</span>
                </div>
              </div>

              {/* Thumbnail Grid */}
              {photos.length > 1 && (
                <div className="hidden lg:grid grid-cols-2 gap-1">
                  {photos.slice(1, 5).map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => { setActiveImage(index + 1); setLightboxOpen(true); }}
                      className="relative aspect-square overflow-hidden hover:opacity-90 transition-opacity group"
                    >
                      <img src={photo.url} alt="" className="w-full h-full object-cover" />
                      {index === 3 && photos.length > 5 && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                          <span className="text-white font-semibold">+{photos.length - 5} more</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Thumbnails */}
            {photos.length > 1 && (
              <div className="lg:hidden flex gap-2 p-2 overflow-x-auto">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => setActiveImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 ${activeImage === index ? 'border-red-600' : 'border-transparent'}`}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Column */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-1">{displayName}</h1>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <span>{locationStr}</span>
                      <span>•</span>
                      <span>Member since {memberSince}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSave} className={`p-2 rounded-lg transition-colors ${saved ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                      <svg className="w-6 h-6" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                    <button onClick={handleShare} className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>
                    <button onClick={() => setShowReportModal(true)} className="p-2 bg-gray-800 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </button>
                  </div>
                </div>

                {/* Specialties / Services Tags */}
                {servicesArray.filter(s => s.included).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {servicesArray.filter(s => s.included).map(service => (
                      <span key={service.name} className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded-full text-sm">{service.name}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-800 mb-6 overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {['about', 'services', 'rates', 'contact', 'reviews'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-red-600 text-white' : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                    >
                      {tab}
                      {tab === 'reviews' && reviewCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                          {reviewCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="min-h-[400px]">
                {activeTab === 'about' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-semibold mb-3">About</h3>
                      <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                        {listing.description || profile.bio || 'No description provided yet.'}
                      </p>
                    </div>

                    {profile.bio && listing.description && profile.bio !== listing.description && (
                      <div>
                        <h3 className="text-white font-semibold mb-3">Bio</h3>
                        <p className="text-gray-300 whitespace-pre-line leading-relaxed">{profile.bio}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'services' && (
                  <div>
                    <h3 className="text-white font-semibold mb-4">Services Offered</h3>
                    {servicesArray.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {servicesArray.map(service => (
                          <div key={service.name} className={`flex items-center gap-3 p-4 rounded-lg border ${service.included ? 'bg-green-900/10 border-green-800/50' : 'bg-gray-800/30 border-gray-700 opacity-50'}`}>
                            <span className={service.included ? 'text-white' : 'text-gray-500'}>{service.name}</span>
                            {service.included && <svg className="w-5 h-5 text-green-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No services listed yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'rates' && (
                  <div className="space-y-6">
                    {ratesEntries.length > 0 ? (
                      <div className="grid gap-3">
                        {ratesEntries.map(([duration, info]) => (
                          <div key={duration} className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                            <div>
                              <span className="text-gray-300">{duration}</span>
                              {typeof info === 'object' && info?.note && <p className="text-gray-500 text-xs mt-1">{info.note}</p>}
                            </div>
                            <div className="text-right">
                              <span className="text-white font-bold text-xl">
                                {typeof info === 'object' ? info?.price || info : info}
                              </span>
                              {typeof info === 'object' && info?.deposit && <p className="text-gray-500 text-xs">Deposit: {info.deposit}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400">No rates listed yet. Contact for pricing.</p>
                    )}
                  </div>
                )}

                {activeTab === 'contact' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {profile.contact_email && (
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                          <h4 className="text-gray-400 text-sm mb-1">Email</h4>
                          <a href={`mailto:${profile.contact_email}`} className="text-white hover:text-red-400 transition-colors">{profile.contact_email}</a>
                        </div>
                      )}
                      {profile.contact_phone && (
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                          <h4 className="text-gray-400 text-sm mb-1">Phone</h4>
                          <a href={`tel:${profile.contact_phone}`} className="text-white hover:text-red-400 transition-colors">{profile.contact_phone}</a>
                        </div>
                      )}
                      {profile.website && (
                        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                          <h4 className="text-gray-400 text-sm mb-1">Website</h4>
                          <a href={(() => { try { const u = new URL(profile.website.startsWith('http') ? profile.website : `https://${profile.website}`); return ['http:', 'https:'].includes(u.protocol) ? u.href : '#'; } catch { return '#'; } })()} target="_blank" rel="noopener noreferrer" className="text-white hover:text-red-400 transition-colors">{profile.website}</a>
                        </div>
                      )}
                    </div>

                    {/* Social Links */}
                    {Object.keys(socialLinks).length > 0 && (
                      <div>
                        <h3 className="text-white font-semibold mb-3">Social Links</h3>
                        <div className="space-y-2">
                          {Object.entries(socialLinks).map(([platform, handle]) => (
                            handle && (
                              <div key={platform} className="flex items-center gap-3 text-gray-300">
                                <span className="capitalize text-gray-400 w-24">{platform}:</span>
                                <span className="text-white">{handle}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {!profile.contact_email && !profile.contact_phone && !profile.website && Object.keys(socialLinks).length === 0 && (
                      <p className="text-gray-400">No contact information provided yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {/* Rating Summary */}
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-4xl font-bold text-white">{averageRating.toFixed(1)}</div>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= Math.round(averageRating)
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-gray-500 text-sm mt-1">{reviewCount} reviews</p>
                        </div>
                        <div className="flex-1 border-l border-gray-800 pl-6">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const count = reviews.filter(r => r.rating === rating).length;
                            const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
                            return (
                              <div key={rating} className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400 w-3">{rating}</span>
                                <Star className="w-3 h-3 text-gray-600" />
                                <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-yellow-500 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="text-gray-500 w-8 text-right">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Write Review Button */}
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Write a Review
                    </button>

                    {/* Review Form Modal */}
                    {showReviewForm && (
                      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-[#1a1a1a] rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white text-lg font-semibold">Write a Review</h3>
                            <button
                              onClick={() => setShowReviewForm(false)}
                              className="text-gray-400 hover:text-white"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                          <ReviewForm
                            listingId={listing.id}
                            profileId={profile.id}
                            onSubmit={handleSubmitReview}
                            onClose={() => setShowReviewForm(false)}
                          />
                        </div>
                      </div>
                    )}

                    {/* Reviews List */}
                    {loadingReviews ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                      </div>
                    ) : reviews.length === 0 ? (
                      <div className="text-center py-12 bg-[#1a1a1a] rounded-lg border border-gray-800">
                        <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white font-medium mb-2">No Reviews Yet</h3>
                        <p className="text-gray-400 text-sm">Be the first to leave a review!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <ReviewCard key={review.id} review={review} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">
                {/* CTA Card */}
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-white font-semibold mb-4">Book a Session</h3>
                  {profile.contact_email && (
                    <a href={`mailto:${profile.contact_email}?subject=Booking Inquiry from DommeDirectory`}>
                      <Button fullWidth size="lg" className="mb-3">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        Send Email
                      </Button>
                    </a>
                  )}
                  {profile.contact_phone && (
                    <a href={`tel:${profile.contact_phone}`}>
                      <Button variant="secondary" fullWidth size="lg" className="mb-4">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        Call
                      </Button>
                    </a>
                  )}

                  <div className="space-y-3 pt-4 border-t border-gray-700">
                    {profile.contact_email && (
                      <div className="flex items-center gap-3 text-gray-300 text-sm">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        {profile.contact_email}
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center gap-3 text-gray-300 text-sm">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                        {profile.website}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-gray-300 text-sm">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {locationStr}
                    </div>
                  </div>
                </div>

                {/* Verified Badge */}
                {profile.is_verified && (
                  <div className="bg-green-900/20 rounded-lg p-4 border border-green-800">
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      <div>
                        <p className="text-green-400 font-medium text-sm">Verified Profile</p>
                        <p className="text-green-400/70 text-xs mt-1">Identity confirmed. Always practice SSC (Safe, Sane, Consensual).</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Profiles */}
        {similarListings.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <h2 className="text-white text-xl font-semibold mb-4">Similar Dommes in {location.city}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarListings.map(l => (
                <Link key={l.id} href={`/listings/${l.id}`} className="group">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-800">
                    <img
                      src={l.profiles?.profile_picture_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'}
                      alt={l.profiles?.display_name || l.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="text-white font-semibold">{l.profiles?.display_name || l.title}</h3>
                      <p className="text-gray-400 text-xs">{l.locations?.city}, {l.locations?.country}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
