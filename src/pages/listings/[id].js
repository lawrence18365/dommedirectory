import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import SEO, { generateListingSchema, generateProfilePageSchema } from '../../components/ui/SEO';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../context/ToastContext';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { getListingReviews, getListingRating, createReview } from '../../services/reviews';
import {
  LEAD_EVENT_TYPES,
  getLeadIdentifiers,
  getUtmContext,
  trackLeadEvent,
} from '../../services/leadEvents';
import { ReviewCard, ReviewForm } from '../../components/ui/ReviewCard';
import { MessageSquare, Loader2, Star } from 'lucide-react';
import {
  getSafePublicUrl,
  isPublicBusinessEmail,
  normalizeEmail,
} from '../../utils/seededContact';
import { buildProfilePath } from '../../utils/profileSlug';
import { generateBreadcrumbSchema, generateFAQSchema } from '../../components/ui/SEO';
import { buildPlatformLinks, getTwitterHandle } from '../../utils/affiliateLinks';
import { slugifyService } from '../../utils/services';

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

// Platform Links Component — affiliate-wrapped content platform buttons
function PlatformLinks({ links, isPremium = true, onTrack }) {
  if (!links || links.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const Element = isPremium ? 'a' : 'span';
        const props = isPremium
          ? {
            href: link.url,
            target: '_blank',
            rel: 'noopener noreferrer',
            onClick: () => onTrack && onTrack(link.trackingKey),
          }
          : {};

        return (
          <Element
            key={link.platformId}
            {...props}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-opacity ${isPremium ? 'hover:opacity-80 cursor-pointer' : 'opacity-60 cursor-default'} ${link.badgeColor}`}
          >
            {link.label}
            {link.monetised && isPremium && (
              <span className="text-[10px] opacity-60 ml-0.5">↗</span>
            )}
          </Element>
        );
      })}
    </div>
  );
}

// Twitter embed widget — shows their feed inline for discovery
function TwitterEmbed({ handle }) {
  if (!handle) return null;
  return (
    <div className="rounded-lg border border-gray-800 overflow-hidden bg-[#0a0a0a]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <p className="text-white text-sm font-medium">Latest from @{handle}</p>
        <a
          href={`https://twitter.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-white transition-colors"
        >
          View profile →
        </a>
      </div>
      <div className="p-4">
        <a
          className="twitter-timeline"
          data-height="400"
          data-theme="dark"
          data-chrome="noheader nofooter noborders transparent"
          data-tweet-limit="3"
          href={`https://twitter.com/${handle}?ref_src=dommedirectory`}
        >
          Loading tweets from @{handle}…
        </a>
        <Script
          src="https://platform.twitter.com/widgets.js"
          strategy="lazyOnload"
          charSet="utf-8"
        />
      </div>
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const appendQueryString = (path, query = {}, routeParamKey) => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (key === routeParamKey || value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => params.append(key, String(item)));
      return;
    }
    params.append(key, String(value));
  });
  const search = params.toString();
  return search ? `${path}?${search}` : path;
};

export async function getListingPagePropsById(id) {
  if (!isSupabaseConfigured) {
    return {
      listing: null,
      similarListings: [],
      error: 'Listing data is unavailable until Supabase is configured.',
    };
  }

  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles(
          id, display_name, bio, tagline, faq, is_verified, profile_picture_url,
          contact_email, contact_phone, website, social_links,
          services_offered, verification_tier, response_time_hours,
          last_active_at, created_at, premium_tier
        ),
        locations!inner(id, city, state, country),
        media(id, storage_path, is_primary)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { listing: null, similarListings: [], error: null, notFound: true };
      }
      throw error;
    }

    if (!listing) {
      return { listing: null, similarListings: [], error: null, notFound: true };
    }

    let similarListings = [];
    if (listing.location_id) {
      const { data: similar } = await supabase
        .from('listings')
        .select(`
          id, slug, title,
          profiles(id, display_name, profile_picture_url),
          locations!inner(id, city, state, country)
        `)
        .eq('location_id', listing.location_id)
        .eq('is_active', true)
        .neq('id', id)
        .limit(4);

      similarListings = similar || [];
    }

    return {
      listing,
      similarListings,
      error: null,
      notFound: false,
    };
  } catch (error) {
    console.error('Error fetching listing:', error);
    return {
      listing: null,
      similarListings: [],
      error: 'Failed to load listing data',
      notFound: false,
    };
  }
}

export async function getServerSideProps(context) {
  const { id } = context.params;

  if (!UUID_RE.test(id)) {
    return { notFound: true };
  }

  const result = await getListingPagePropsById(id);

  if (result.notFound) {
    return { notFound: true };
  }

  if (!result.listing) {
    return {
      props: {
        listing: result.listing,
        similarListings: result.similarListings,
        error: result.error,
      },
    };
  }

  const destination = appendQueryString(buildProfilePath(result.listing), context.query, 'id');

  return {
    redirect: {
      destination,
      permanent: true,
    },
  };
}

export default function ProfileDetail({ listing, similarListings, error: serverError, ratingData }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('about');
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('Fake photos');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [showClaimRequestModal, setShowClaimRequestModal] = useState(false);
  const [claimProofMethod, setClaimProofMethod] = useState('website_code');
  const [claimProofLocation, setClaimProofLocation] = useState('');
  const [claimRequestSubmitting, setClaimRequestSubmitting] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeRequesterEmail, setRemoveRequesterEmail] = useState('');
  const [removeReason, setRemoveReason] = useState('');
  const [removeSubmitting, setRemoveSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [mediaUnlocked, setMediaUnlocked] = useState(false);

  // Fetch reviews when tab is selected
  useEffect(() => {
    if (activeTab === 'reviews' && listing?.id) {
      fetchReviews();
    }
  }, [activeTab, listing?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setCurrentUserId(null);
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      setCurrentUserId(data?.user?.id || null);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!currentUserId) {
      setMediaUnlocked(false);
      return;
    }

    const ageConfirmed = window.localStorage.getItem('dd_age_gate_confirmed') === 'true';
    setMediaUnlocked(ageConfirmed);
  }, [currentUserId]);

  useEffect(() => {
    if (!listing?.id || !listing?.is_active) return;

    trackLeadEvent({
      listingId: listing.id,
      eventType: LEAD_EVENT_TYPES.LISTING_VIEW,
      cityPage: listing.locations?.city || null,
      metadata: {
        source: 'listing_page',
      },
    });
  }, [listing?.id, listing?.is_active, listing?.locations?.city]);

  useEffect(() => {
    if (!listing?.id) return;

    getListingRating(listing.id).then(({ average, count }) => {
      setAverageRating(average || 0);
      setReviewCount(count || 0);
    });
  }, [listing?.id]);

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

  const hasRestrictedMedia = mediaItems.length > 0;
  const canViewMedia = !hasRestrictedMedia || mediaUnlocked;

  const isPremium = profile.premium_tier === 'pro' || profile.premium_tier === 'elite';
  const isOwnedProfile = currentUserId === listing.profile_id;

  const photosArray = mediaItems.length > 0
    ? mediaItems
      .sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
      .map((m, i) => ({ id: m.id, url: m.storage_path, type: i === 0 ? 'main' : 'gallery' }))
    : [{ id: 'default', url: profile.profile_picture_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=1200&h=1500&fit=crop', type: 'main' }];

  const photos = canViewMedia
    ? (isPremium ? photosArray : photosArray.slice(0, 1))
    : [{
      id: 'gated',
      url:
        profile.profile_picture_url ||
        'https://images.unsplash.com/photo-1518600506278-4e8ef466b810?w=1200&h=1500&fit=crop',
      type: 'main',
    }];

  // Build display data
  const displayName = profile.display_name || listing.title || 'Unknown';
  const profilePath = buildProfilePath(listing);
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
  const isListingActive = Boolean(listing.is_active);
  const isSeededUnclaimed = Boolean(listing.is_seeded) && !listing.profile_id;
  const isSeededUnclaimedActive = isListingActive && isSeededUnclaimed;
  const sourceUrl = getSafePublicUrl(listing.seed_source_url);
  const sourceLabel = listing.seed_source_label || 'public source';
  const safeProfileWebsiteUrl = getSafePublicUrl(profile.website);
  const safeSeedWebsiteUrl = getSafePublicUrl(listing.seed_contact_website);
  const sourceFallbackWebsiteUrl = isSeededUnclaimedActive ? sourceUrl : null;
  const contactWebsiteUrl =
    safeProfileWebsiteUrl ||
    (isSeededUnclaimedActive ? safeSeedWebsiteUrl || sourceFallbackWebsiteUrl : null);
  const isSourceFallbackContact = Boolean(
    isSeededUnclaimedActive &&
    !safeProfileWebsiteUrl &&
    !safeSeedWebsiteUrl &&
    sourceFallbackWebsiteUrl
  );
  const contactWebsiteLabel = safeProfileWebsiteUrl
    ? profile.website || safeProfileWebsiteUrl
    : safeSeedWebsiteUrl
      ? listing.seed_contact_website || safeSeedWebsiteUrl
      : isSourceFallbackContact
        ? 'View Source Profile'
        : contactWebsiteUrl;
  const websiteButtonEventType = isSourceFallbackContact
    ? LEAD_EVENT_TYPES.CONTACT_WEBSITE_CLICK
    : LEAD_EVENT_TYPES.CONTACT_BOOKING_CLICK;
  const websiteButtonLabel = isSourceFallbackContact ? 'View Source Profile' : 'Open Booking / Contact';
  const seedEmailEligible = isSeededUnclaimedActive
    ? isPublicBusinessEmail({
      email: listing.seed_contact_email,
      sourceUrl: listing.seed_source_url,
      websiteUrl: listing.seed_contact_website || profile.website,
    })
    : false;
  const contactEmail = profile.contact_email
    ? profile.contact_email.trim()
    : seedEmailEligible
      ? normalizeEmail(listing.seed_contact_email)
      : null;
  const contactPhone = profile.contact_phone || null;
  const contactHandle = isSeededUnclaimedActive && listing.seed_contact_handle ? listing.seed_contact_handle : null;
  const canShowContactCtas = isListingActive;
  const hasSocialLinks = Object.values(socialLinks).some(Boolean);
  const hasDirectContact = Boolean(contactEmail || contactPhone || contactWebsiteUrl || contactHandle);
  const platformLinks = buildPlatformLinks(socialLinks, listing.seed_contact_website);
  const twitterHandle = getTwitterHandle(socialLinks);
  const citySlug = (location.city || '').toLowerCase().replace(/\s+/g, '-');
  const activeServices = servicesArray.filter((s) => s.included).map((s) => s.name);
  const listingUnavailableMessage = 'This listing is no longer available.';
  const claimVerificationCode =
    currentUserId && listing?.id
      ? `DD-${listing.id.replace(/-/g, '').slice(0, 6).toUpperCase()}-${currentUserId
        .replace(/-/g, '')
        .slice(0, 6)
        .toUpperCase()}`
      : null;
  const claimProofMethodHint = claimProofMethod === 'website_code'
    ? 'Add the code to your website homepage, contact page, or public bio.'
    : 'Add the code to your source profile bio/description, then paste that profile URL.';

  const responseTimeLabel = profile.response_time_hours
    ? `${profile.response_time_hours} hour${profile.response_time_hours === 1 ? '' : 's'}`
    : 'Not provided';
  const lastActiveLabel = profile.last_active_at
    ? new Date(profile.last_active_at).toLocaleDateString()
    : listing.updated_at
      ? new Date(listing.updated_at).toLocaleDateString()
      : 'Unknown';
  const primaryContact = !canShowContactCtas
    ? null
    : (!isPremium && !isSeededUnclaimedActive)
      ? {
        label: isOwnedProfile ? 'Upgrade to Pro to Unlock Outbound Links' : 'Direct Link Locked (Provider is Basic)',
        href: isOwnedProfile ? '/pricing' : '#',
        eventType: 'locked_click',
        disabled: !isOwnedProfile,
      }
      : contactEmail
        ? {
          label: 'Send Booking Email',
          href: `mailto:${contactEmail}?subject=Booking Inquiry from DommeDirectory`,
          eventType: LEAD_EVENT_TYPES.CONTACT_EMAIL_CLICK,
        }
        : contactPhone
          ? {
            label: 'Call Now',
            href: `tel:${contactPhone}`,
            eventType: LEAD_EVENT_TYPES.CONTACT_PHONE_CLICK,
          }
          : contactWebsiteUrl
            ? {
              label: websiteButtonLabel,
              href: contactWebsiteUrl,
              eventType: websiteButtonEventType,
            }
            : null;

  const handleUnlockMedia = () => {
    if (!currentUserId) {
      router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dd_age_gate_confirmed', 'true');
    }
    setMediaUnlocked(true);
  };

  const handleSave = () => {
    setSaved(!saved);
    showToast(saved ? 'Removed from favorites' : 'Added to favorites', 'success');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard', 'success');
  };

  const trackContactAction = (eventType, source = 'sidebar_cta') => {
    if (!isListingActive) return;

    trackLeadEvent({
      listingId: listing.id,
      eventType,
      cityPage: location.city || null,
      metadata: {
        source,
      },
    });
  };

  const getAuthAccessToken = async () => {
    if (!isSupabaseConfigured) return null;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const openClaimRequest = () => {
    if (!currentUserId) {
      router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    setShowClaimRequestModal(true);
  };

  const handleSubmitClaimRequest = async () => {
    if (!currentUserId) {
      router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (!claimVerificationCode) {
      showToast('Please log in again to create a claim request.', 'error');
      return;
    }

    if (!claimProofLocation || claimProofLocation.trim().length < 5) {
      showToast('Please add the page/profile URL where you placed the code.', 'error');
      return;
    }

    setClaimRequestSubmitting(true);
    try {
      const token = await getAuthAccessToken();
      if (!token) {
        throw new Error('Please log in again to submit your claim request.');
      }

      const response = await fetch('/api/listings/claim-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId: listing.id,
          proofMethod: claimProofMethod,
          proofLocation: claimProofLocation.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Unable to submit claim request');
      }

      setShowClaimRequestModal(false);
      setClaimProofMethod('website_code');
      setClaimProofLocation('');
      showToast('Claim request submitted. We will review and verify ownership shortly.', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to submit claim request right now.', 'error');
    } finally {
      setClaimRequestSubmitting(false);
    }
  };

  const handleSubmitRemoval = async () => {
    const normalizedEmail = normalizeEmail(removeRequesterEmail);
    if (!normalizedEmail) {
      showToast('Please provide a valid email address.', 'error');
      return;
    }

    if (!removeReason || removeReason.trim().length < 3) {
      showToast('Please include a short reason for removal.', 'error');
      return;
    }

    setRemoveSubmitting(true);
    try {
      const response = await fetch('/api/listings/removal-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
          requesterEmail: normalizedEmail,
          reason: removeReason.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to submit removal request');
      }

      setShowRemoveModal(false);
      setRemoveRequesterEmail('');
      setRemoveReason('');

      if (result.autoRemoved) {
        showToast('Listing removed successfully.', 'success');
      } else {
        showToast('Removal request submitted. Our team will review it within 24 hours.', 'success');
      }

      router.replace(router.asPath);
    } catch (error) {
      showToast(error.message || 'Unable to submit request right now.', 'error');
    } finally {
      setRemoveSubmitting(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      showToast('Please choose a report reason.', 'error');
      return;
    }

    setReportSubmitting(true);
    try {
      const { visitorId, sessionId } = getLeadIdentifiers();
      const response = await fetch('/api/reports/listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
          reason: reportReason,
          details: reportDetails,
          sourcePage: profilePath,
          visitorId,
          sessionId,
          cityPage: location.city || null,
          pagePath: typeof window !== 'undefined' ? window.location.pathname : null,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
          ...getUtmContext(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || 'Failed to submit report');
      }

      setShowReportModal(false);
      setReportDetails('');
      setReportReason('Fake photos');
      showToast('Report submitted. Our moderation team will review it.', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to submit report right now.', 'error');
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <Layout>
      <SEO
        title={`${displayName} - ${locationStr}`}
        description={
          profile.tagline ||
          listing.description?.substring(0, 160) ||
          `View ${displayName}'s profile on DommeDirectory`
        }
        canonical={`https://dommedirectory.com${profilePath}`}
        robotsContent="index,follow,noimageindex,max-image-preview:none"
        ogImage={profile.profile_picture_url || 'https://dommedirectory.com/og-image.jpg'}
        geo={{
          city: location.city,
          state: location.state,
          country: location.country,
          latitude: location.latitude,
          longitude: location.longitude,
        }}
        jsonLd={[
          generateListingSchema(listing, ratingData),
          generateProfilePageSchema(listing),
          generateBreadcrumbSchema([
            { name: 'Home', url: 'https://dommedirectory.com' },
            { name: 'Locations', url: 'https://dommedirectory.com/cities' },
            { name: location.city || 'Location', url: `https://dommedirectory.com/location/${(location.city || '').toLowerCase().replace(/\s+/g, '-')}` },
            { name: displayName, url: `https://dommedirectory.com${profilePath}` },
          ]),
          ...(generateFAQSchema(profile.faq) ? [generateFAQSchema(profile.faq)] : []),
        ].filter(Boolean)}
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
                  <input
                    type="radio"
                    name="report"
                    value={reason}
                    checked={reportReason === reason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="text-red-600"
                  />
                  {reason}
                </label>
              ))}
            </div>
            <textarea
              className="w-full bg-gray-700 text-white rounded p-3 mb-4 text-sm"
              rows={3}
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              placeholder="Additional details (optional)"
            />
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowReportModal(false)}>Cancel</Button>
              <Button fullWidth isLoading={reportSubmitting} onClick={handleReport}>Submit Report</Button>
            </div>
          </div>
        </div>
      )}

      {showClaimRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-lg w-full p-6">
            <h3 className="text-white text-lg font-semibold mb-2">Request Claim</h3>
            <p className="text-gray-300 text-sm">
              Add this code to your public profile, then submit the proof URL for review.
            </p>
            <div className="mt-3 rounded border border-amber-700/60 bg-amber-900/20 p-3">
              <p className="text-xs uppercase tracking-wide text-amber-200">Verification code</p>
              <p className="mt-1 font-mono text-sm text-amber-100">
                {claimVerificationCode || 'Log in to generate a code'}
              </p>
            </div>

            <label className="mt-4 block text-gray-300 text-sm mb-2" htmlFor="claim-method">
              Proof method
            </label>
            <select
              id="claim-method"
              value={claimProofMethod}
              onChange={(event) => setClaimProofMethod(event.target.value)}
              className="w-full bg-gray-700 text-white rounded p-3 text-sm"
            >
              <option value="website_code">Website code</option>
              <option value="source_profile_code">Source profile code</option>
            </select>

            <p className="mt-2 text-xs text-gray-400">{claimProofMethodHint}</p>

            <label className="mt-4 block text-gray-300 text-sm mb-2" htmlFor="claim-proof-location">
              Proof URL
            </label>
            <input
              id="claim-proof-location"
              type="text"
              value={claimProofLocation}
              onChange={(event) => setClaimProofLocation(event.target.value)}
              placeholder="https://example.com/page-with-code"
              className="w-full bg-gray-700 text-white rounded p-3 text-sm"
            />

            <div className="flex gap-3 mt-5">
              <Button variant="secondary" fullWidth onClick={() => setShowClaimRequestModal(false)}>
                Cancel
              </Button>
              <Button fullWidth isLoading={claimRequestSubmitting} onClick={handleSubmitClaimRequest}>
                Submit Claim Request
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRemoveModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-white text-lg font-semibold mb-4">Remove Listing</h3>
            <p className="text-gray-400 text-sm mb-4">
              Request removal if this listing should not be publicly visible.
            </p>
            <input
              type="email"
              value={removeRequesterEmail}
              onChange={(event) => setRemoveRequesterEmail(event.target.value)}
              placeholder="Business contact email"
              className="w-full bg-gray-700 text-white rounded p-3 mb-3 text-sm"
            />
            <textarea
              className="w-full bg-gray-700 text-white rounded p-3 mb-4 text-sm"
              rows={3}
              value={removeReason}
              onChange={(event) => setRemoveReason(event.target.value)}
              placeholder="Reason for removal"
            />
            <div className="flex gap-3">
              <Button variant="secondary" fullWidth onClick={() => setShowRemoveModal(false)}>
                Cancel
              </Button>
              <Button fullWidth isLoading={removeSubmitting} onClick={handleSubmitRemoval}>
                Submit Request
              </Button>
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
                className={`relative aspect-[4/5] lg:aspect-auto lg:h-[600px] group ${canViewMedia ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => {
                  if (!canViewMedia) return;
                  setLightboxOpen(true);
                }}
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
                {!canViewMedia && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-6">
                    <div className="max-w-sm text-center">
                      <p className="text-sm font-semibold text-white">
                        Media is protected behind age confirmation and login.
                      </p>
                      <p className="mt-2 text-xs text-gray-300">
                        This keeps public pages professional while allowing verified adults to view provider media.
                      </p>
                      <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                        {!currentUserId && (
                          <Link
                            href={`/auth/login?redirect=${encodeURIComponent(router.asPath)}`}
                            className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded bg-gray-100 text-gray-900 hover:bg-white"
                          >
                            Log In
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={handleUnlockMedia}
                          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          I am 18+, show media
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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

                {/* Content Platforms — affiliate-wrapped, visible above the fold */}
                {platformLinks.length > 0 && (
                  <div className="mt-5">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Content & Platforms</p>
                    {!isPremium && isOwnedProfile && (
                      <div className="mb-3 text-red-400 text-xs font-semibold bg-red-900/20 p-2 rounded border border-red-900/50">
                        Notice: Links are text-only. Upgrade to Pro to make them clickable.
                      </div>
                    )}
                    <PlatformLinks
                      links={platformLinks}
                      isPremium={isPremium}
                      onTrack={(platformId) =>
                        trackLeadEvent({
                          listingId: listing.id,
                          eventType: LEAD_EVENT_TYPES.CONTACT_WEBSITE_CLICK,
                          cityPage: location.city || null,
                          metadata: { source: 'platform_link', platform: platformId },
                        })
                      }
                    />
                  </div>
                )}

                {isSeededUnclaimedActive && (
                  <div className="mt-5 rounded-lg border border-amber-700/60 bg-amber-900/20 p-4">
                    <p className="text-sm font-semibold text-amber-200">
                      This listing was created from publicly posted business information.
                    </p>
                    <p className="mt-1 text-sm text-amber-100/90">
                      Claim or update this listing to manage details and earn founder featured placement.
                    </p>
                    <p className="mt-1 text-xs text-amber-100/80">
                      Source: {sourceUrl ? (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-white"
                        >
                          {sourceLabel}
                        </a>
                      ) : sourceLabel}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" isLoading={claimRequestSubmitting} onClick={openClaimRequest}>
                        Claim / Update
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setShowRemoveModal(true)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                )}

                {!canShowContactCtas && (
                  <div className="mt-5 rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-300">{listingUnavailableMessage}</p>
                  </div>
                )}

                {canShowContactCtas && primaryContact && (
                  <div className="mt-5">
                    {primaryContact.href === '#' ? (
                      <Button size="lg" fullWidth variant="secondary" className="opacity-50 cursor-not-allowed">
                        {primaryContact.label}
                      </Button>
                    ) : (
                      <a
                        href={primaryContact.href}
                        onClick={() => trackContactAction(primaryContact.eventType, 'header_primary_cta')}
                        target={primaryContact.href.startsWith('http') ? '_blank' : undefined}
                        rel={primaryContact.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        <Button size="lg" fullWidth variant={isOwnedProfile && !isPremium ? 'primary' : 'default'}>
                          {primaryContact.label}
                        </Button>
                      </a>
                    )}
                  </div>
                )}

                {canShowContactCtas && !primaryContact && (
                  <div className="mt-5 rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                    <p className="text-sm text-gray-300">Contact details will appear once this listing is updated.</p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Verification</p>
                    <p className="mt-1 text-sm text-white">
                      {profile.is_verified
                        ? `${profile.verification_tier === 'pro' ? 'Pro Verified' : 'Basic Verified'}`
                        : 'Unverified'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Typical Response Time</p>
                    <p className="mt-1 text-sm text-white">{responseTimeLabel}</p>
                  </div>
                  <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500">Trust Signals</p>
                    <p className="mt-1 text-sm text-white">{reviewCount} reviews • Active {lastActiveLabel}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-gray-800 bg-gray-900/40 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Safety</p>
                  <p className="mt-1 text-sm text-gray-300">
                    Verification badges confirm identity and profile control. Never send cash outside trusted channels.
                  </p>
                </div>
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

                    {/* Twitter / X feed embed */}
                    {twitterHandle && isPremium && (
                      <div className="mt-2">
                        <TwitterEmbed handle={twitterHandle} />
                      </div>
                    )}
                    {twitterHandle && !isPremium && isOwnedProfile && (
                      <div className="mt-4 text-red-400 text-xs font-semibold bg-red-900/20 p-3 rounded border border-red-900/50">
                        Notice: Your Twitter feed is hidden because you are on the Basic tier. Upgrade to Pro to embed your social feed.
                      </div>
                    )}

                    {/* FAQ if provider has set one */}
                    {profile.faq && Array.isArray(profile.faq) && profile.faq.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-white font-semibold mb-3">FAQ</h3>
                        <div className="space-y-3">
                          {profile.faq.map((item, i) => (
                            <div key={i} className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4">
                              <p className="text-white font-medium text-sm">{item.question}</p>
                              <p className="text-gray-400 text-sm mt-1">{item.answer}</p>
                            </div>
                          ))}
                        </div>
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
                    {!canShowContactCtas ? (
                      <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-4">
                        <p className="text-sm text-gray-300">{listingUnavailableMessage}</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {contactEmail && (
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                              <h4 className="text-gray-400 text-sm mb-1">Email</h4>
                              <a
                                href={`mailto:${contactEmail}`}
                                onClick={() => trackContactAction(LEAD_EVENT_TYPES.CONTACT_EMAIL_CLICK, 'contact_tab_email')}
                                className="text-white hover:text-red-400 transition-colors break-all"
                              >
                                {contactEmail}
                              </a>
                            </div>
                          )}
                          {contactPhone && (
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                              <h4 className="text-gray-400 text-sm mb-1">Phone</h4>
                              <a
                                href={`tel:${contactPhone}`}
                                onClick={() => trackContactAction(LEAD_EVENT_TYPES.CONTACT_PHONE_CLICK, 'contact_tab_phone')}
                                className="text-white hover:text-red-400 transition-colors"
                              >
                                {contactPhone}
                              </a>
                            </div>
                          )}
                          {contactWebsiteUrl && (
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                              <h4 className="text-gray-400 text-sm mb-1">Website</h4>
                              <a
                                href={contactWebsiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackContactAction(LEAD_EVENT_TYPES.CONTACT_WEBSITE_CLICK, 'contact_tab_website')}
                                className="text-white hover:text-red-400 transition-colors break-all"
                              >
                                {contactWebsiteLabel || contactWebsiteUrl}
                              </a>
                            </div>
                          )}
                          {contactHandle && (
                            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                              <h4 className="text-gray-400 text-sm mb-1">Handle</h4>
                              <p className="text-white">{contactHandle}</p>
                            </div>
                          )}
                        </div>

                        {/* Social Links */}
                        {hasSocialLinks && (
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

                        {!hasDirectContact && !hasSocialLinks && (
                          <p className="text-gray-400">No contact information provided yet.</p>
                        )}
                      </>
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
                                className={`w-4 h-4 ${star <= Math.round(averageRating)
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
                  <h3 className="text-white font-semibold mb-4">
                    {canShowContactCtas ? 'Book a Session' : 'Listing Status'}
                  </h3>

                  {!canShowContactCtas ? (
                    <p className="text-sm text-gray-300">{listingUnavailableMessage}</p>
                  ) : (
                    <>
                      {contactEmail && (
                        <a
                          href={`mailto:${contactEmail}?subject=Booking Inquiry from DommeDirectory`}
                          onClick={() => trackContactAction(LEAD_EVENT_TYPES.CONTACT_EMAIL_CLICK, 'sidebar_email_button')}
                        >
                          <Button fullWidth size="lg" className="mb-3">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Send Email
                          </Button>
                        </a>
                      )}
                      {contactPhone && (
                        <a
                          href={`tel:${contactPhone}`}
                          onClick={() => trackContactAction(LEAD_EVENT_TYPES.CONTACT_PHONE_CLICK, 'sidebar_phone_button')}
                        >
                          <Button variant="secondary" fullWidth size="lg" className="mb-3">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            Call
                          </Button>
                        </a>
                      )}
                      {contactWebsiteUrl && (
                        <a
                          href={contactWebsiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => trackContactAction(websiteButtonEventType, 'sidebar_website_button')}
                        >
                          <Button variant="ghost" fullWidth size="lg" className="mb-3">
                            {websiteButtonLabel}
                          </Button>
                        </a>
                      )}
                      {!contactEmail && !contactPhone && !contactWebsiteUrl && (
                        <p className="text-sm text-gray-400">Contact details will appear after profile updates.</p>
                      )}

                      <div className="space-y-3 pt-4 border-t border-gray-700">
                        {contactEmail && (
                          <div className="flex items-center gap-3 text-gray-300 text-sm">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {contactEmail}
                          </div>
                        )}
                        {contactWebsiteUrl && (
                          <div className="flex items-center gap-3 text-gray-300 text-sm">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                            {!isPremium && !isSeededUnclaimedActive ? (
                              <span className="text-gray-500 italic">Website hidden (Pro feature)</span>
                            ) : (
                              <a
                                href={contactWebsiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackContactAction(LEAD_EVENT_TYPES.CONTACT_WEBSITE_CLICK, 'sidebar_website_text')}
                                className="hover:text-red-400 transition-colors break-all"
                              >
                                {contactWebsiteLabel || contactWebsiteUrl}
                              </a>
                            )}
                          </div>
                        )}
                        {contactHandle && (
                          <div className="flex items-center gap-3 text-gray-300 text-sm">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a6 6 0 01-12 0 6 6 0 0112 0zm2 12v-1a4 4 0 00-4-4H6a4 4 0 00-4 4v1" /></svg>
                            {contactHandle}
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-gray-300 text-sm">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {locationStr}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Affiliate platform links in sidebar */}
                {platformLinks.length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-white font-semibold mb-3">Around the Web</h3>
                    <div className="flex flex-wrap gap-2">
                      {platformLinks.map((link) => {
                        const Element = isPremium ? 'a' : 'span';
                        const props = isPremium ? {
                          href: link.url,
                          target: "_blank",
                          rel: "noopener noreferrer",
                          onClick: () => trackLeadEvent({
                            listingId: listing.id,
                            eventType: LEAD_EVENT_TYPES.CONTACT_WEBSITE_CLICK,
                            cityPage: location.city || null,
                            metadata: { source: 'sidebar_platform_link', platform: link.platformId },
                          })
                        } : {};

                        return (
                          <Element
                            key={link.platformId}
                            {...props}
                            className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${link.badgeColor} ${!isPremium ? 'opacity-50 cursor-default' : ''}`}
                          >
                            <span className="text-sm font-medium">{link.label}</span>
                          </Element>
                        );
                      })}
                    </div>
                  </div>
                )}

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

        {/* Explore More — service × city internal links for SEO and user navigation */}
        {(activeServices.length > 0 || citySlug) && (
          <div className="max-w-7xl mx-auto px-4 pb-8">
            <div className="border-t border-gray-800 pt-8">
              <h2 className="text-white font-semibold mb-4 text-lg">
                Find More in {location.city || 'Your City'}
              </h2>
              <div className="flex flex-wrap gap-2">
                {/* City page */}
                {citySlug && (
                  <Link
                    href={`/location/${citySlug}`}
                    className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-700 rounded text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                  >
                    All dommes in {location.city}
                  </Link>
                )}
                {/* Service × city combo links */}
                {activeServices.slice(0, 6).map((svc) => (
                  <Link
                    key={svc}
                    href={`/location/${citySlug}/${slugifyService(svc)}`}
                    className="px-3 py-1.5 bg-red-600/10 border border-red-600/20 rounded text-sm text-red-400 hover:text-red-300 hover:border-red-500/40 transition-colors"
                  >
                    {svc} in {location.city}
                  </Link>
                ))}
                {/* Service-only pages */}
                {activeServices.slice(0, 4).map((svc) => (
                  <Link
                    key={`svc-${svc}`}
                    href={`/services/${slugifyService(svc)}`}
                    className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-700 rounded text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                  >
                    All {svc} dommes
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Similar Profiles */}
        {similarListings.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 pb-12">
            <h2 className="text-white text-xl font-semibold mb-4">Similar Dommes in {location.city}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {similarListings.map(l => (
                <Link key={l.id} href={buildProfilePath(l)} className="group">
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
