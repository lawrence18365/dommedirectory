const PRO_TIER = 'pro';
const BASIC_TIER = 'basic';

const getTierRank = (tier, isVerified) => {
  if (tier === PRO_TIER) return 2;
  if (tier === BASIC_TIER || isVerified) return 1;
  return 0;
};

const getActivityScore = (lastActiveAt) => {
  if (!lastActiveAt) return 0;
  const timestamp = new Date(lastActiveAt).getTime();
  if (!Number.isFinite(timestamp)) return 0;

  const hoursSinceActive = (Date.now() - timestamp) / (1000 * 60 * 60);
  if (hoursSinceActive <= 24) return 10;
  if (hoursSinceActive <= 7 * 24) return 6;
  if (hoursSinceActive <= 30 * 24) return 3;
  return 0;
};

const getCreditRemainingSeconds = (credit) => {
  const createdAtMs = new Date(credit.created_at).getTime();
  const elapsedSeconds = Number.isFinite(createdAtMs)
    ? Math.max(0, (Date.now() - createdAtMs) / 1000)
    : 0;

  const granted = Number(credit.seconds_granted || 0);
  const used = Number(credit.seconds_used || 0);
  return Math.max(0, granted - used - elapsedSeconds);
};

export function rankLocationListings({
  listings = [],
  reviews = [],
  featuredCredits = [],
  locationId = null,
}) {
  const reviewStatsByListing = new Map();
  reviews.forEach((review) => {
    const listingId = review.listing_id;
    if (!listingId) return;
    const current = reviewStatsByListing.get(listingId) || { count: 0, sum: 0 };
    current.count += 1;
    current.sum += Number(review.rating || 0);
    reviewStatsByListing.set(listingId, current);
  });

  const creditSecondsByProfile = new Map();
  featuredCredits.forEach((credit) => {
    if (!credit?.profile_id) return;
    if (credit.city_id && locationId && credit.city_id !== locationId) return;
    if (credit.city_id && !locationId) return;

    const remaining = getCreditRemainingSeconds(credit);
    if (remaining <= 0) return;

    const current = creditSecondsByProfile.get(credit.profile_id) || 0;
    creditSecondsByProfile.set(credit.profile_id, current + remaining);
  });

  const ranked = listings.map((listing) => {
    const profile = listing.profiles || {};
    const reviewStats = reviewStatsByListing.get(listing.id) || { count: 0, sum: 0 };
    const avgRating = reviewStats.count > 0 ? reviewStats.sum / reviewStats.count : 0;
    const reviewVolumeScore = Math.min(reviewStats.count * 2, 20);
    const activityScore = getActivityScore(profile.last_active_at || listing.updated_at);
    const qualityScore = Number((avgRating * 20 + reviewVolumeScore + activityScore).toFixed(4));
    const remainingFeaturedSeconds = Math.floor(creditSecondsByProfile.get(profile.id) || 0);
    const effectiveFeatured = Boolean(listing.is_featured) || remainingFeaturedSeconds > 0;
    const verificationRank = getTierRank(profile.verification_tier, profile.is_verified);
    const primaryImage = listing.media?.find((m) => m.is_primary)?.storage_path
      || listing.media?.[0]?.storage_path
      || null;

    return {
      ...listing,
      primaryImage,
      remaining_featured_seconds: remainingFeaturedSeconds,
      is_featured_effective: effectiveFeatured,
      verification_rank: verificationRank,
      quality_score: qualityScore,
      review_count: reviewStats.count,
      average_rating: Number(avgRating.toFixed(2)),
      media: undefined,
    };
  });

  ranked.sort((a, b) => {
    const aFeatured = a.is_featured_effective ? 1 : 0;
    const bFeatured = b.is_featured_effective ? 1 : 0;
    if (aFeatured !== bFeatured) return bFeatured - aFeatured;

    if (a.remaining_featured_seconds !== b.remaining_featured_seconds) {
      return b.remaining_featured_seconds - a.remaining_featured_seconds;
    }

    if (a.verification_rank !== b.verification_rank) {
      return b.verification_rank - a.verification_rank;
    }

    if (a.quality_score !== b.quality_score) {
      return b.quality_score - a.quality_score;
    }

    const createdAtDiff =
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    if (createdAtDiff !== 0) return createdAtDiff;

    return String(a.id || '').localeCompare(String(b.id || ''));
  });

  return ranked;
}
