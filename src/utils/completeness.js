/**
 * Profile completeness scoring system.
 *
 * Each field is weighted by strategic value:
 *   - Fields that create SEO dimensions are worth more
 *   - Fields that create lock-in are worth more
 *   - Fields that improve conversion are worth more
 *
 * A provider with 80%+ completeness gets priority ranking in city listings.
 */

const PROFILE_FIELDS = [
  // Core (high weight — required for basic functionality)
  { key: 'display_name',       weight: 10, label: 'Display name',     category: 'core' },
  { key: 'bio',                weight: 10, label: 'Bio',              category: 'core', minLength: 80 },
  { key: 'primary_location_id',weight: 10, label: 'Location',         category: 'core' },
  { key: 'profile_picture_url',weight: 8,  label: 'Profile photo',    category: 'core' },

  // Strategic (medium-high weight — create SEO dimensions)
  { key: 'tagline',            weight: 6,  label: 'Headline',         category: 'seo' },
  { key: 'experience_years',   weight: 5,  label: 'Years of experience', category: 'seo' },
  { key: 'languages',          weight: 5,  label: 'Languages spoken', category: 'seo', isArray: true },
  { key: 'booking_link',       weight: 5,  label: 'Booking link',     category: 'conversion' },

  // Engagement (medium weight — improve profile quality)
  { key: 'social_twitter',     weight: 3,  label: 'Twitter/X link',   category: 'social' },
  { key: 'social_onlyfans',    weight: 3,  label: 'OnlyFans link',    category: 'social' },
  { key: 'service_area_miles', weight: 3,  label: 'Service area',     category: 'seo' },
  { key: 'faq',                weight: 4,  label: 'FAQ items',        category: 'seo', isArray: true },
  { key: 'contact_email',      weight: 2,  label: 'Contact email',    category: 'conversion' },
  { key: 'website',            weight: 2,  label: 'Website URL',      category: 'conversion' },
];

const LISTING_FIELDS = [
  // Core listing fields
  { key: 'has_listing',        weight: 10, label: 'First listing created', category: 'core' },
  { key: 'listing_photos',     weight: 6,  label: 'Listing photos',   category: 'core' },

  // Strategic listing fields
  { key: 'session_formats',    weight: 5,  label: 'Session formats',   category: 'seo' },
  { key: 'accepts_beginners',  weight: 4,  label: 'Beginner-friendly', category: 'seo' },
  { key: 'session_durations',  weight: 3,  label: 'Session durations', category: 'seo' },
  { key: 'space_type',         weight: 3,  label: 'Space type',        category: 'seo' },
  { key: 'minimum_notice',     weight: 2,  label: 'Minimum notice',    category: 'conversion' },
  { key: 'deposit_required',   weight: 2,  label: 'Deposit info',      category: 'conversion' },
  { key: 'rates',              weight: 4,  label: 'Rates',             category: 'conversion' },
];

const ALL_FIELDS = [...PROFILE_FIELDS, ...LISTING_FIELDS];
const MAX_SCORE = ALL_FIELDS.reduce((sum, f) => sum + f.weight, 0);

/**
 * Calculate completeness score (0-100) for a profile + its listings.
 *
 * @param {Object} profile - Profile record from Supabase
 * @param {Array} listings - Array of listing records
 * @param {Array} media - Array of media records (optional)
 * @returns {{ score: number, filled: string[], missing: { key: string, label: string, category: string, weight: number }[] }}
 */
export function calculateCompleteness(profile, listings = [], media = []) {
  let earned = 0;
  const filled = [];
  const missing = [];

  // Score profile fields
  for (const field of PROFILE_FIELDS) {
    let isFilled = false;

    if (field.key === 'social_twitter') {
      isFilled = Boolean(profile?.social_links?.twitter?.trim());
    } else if (field.key === 'social_onlyfans') {
      isFilled = Boolean(profile?.social_links?.onlyfans?.trim());
    } else if (field.isArray) {
      const val = profile?.[field.key];
      isFilled = Array.isArray(val) && val.length > 0;
    } else if (field.minLength) {
      isFilled = Boolean(profile?.[field.key]?.trim()) && profile[field.key].trim().length >= field.minLength;
    } else {
      isFilled = Boolean(profile?.[field.key]);
    }

    if (isFilled) {
      earned += field.weight;
      filled.push(field.key);
    } else {
      missing.push({ key: field.key, label: field.label, category: field.category, weight: field.weight });
    }
  }

  // Score listing fields
  const bestListing = listings?.[0] || null;

  for (const field of LISTING_FIELDS) {
    let isFilled = false;

    if (field.key === 'has_listing') {
      isFilled = listings && listings.length > 0;
    } else if (field.key === 'listing_photos') {
      isFilled = media && media.length > 0;
    } else if (field.key === 'rates') {
      const rates = bestListing?.rates || {};
      isFilled = Object.values(rates).some(v => v && String(v).trim() !== '' && Number(v) > 0);
    } else if (field.key === 'session_formats') {
      const formats = bestListing?.session_formats || {};
      isFilled = Object.values(formats).some(Boolean);
    } else if (field.key === 'session_durations') {
      const durations = bestListing?.session_durations || {};
      isFilled = Object.values(durations).some(Boolean);
    } else if (field.key === 'accepts_beginners') {
      isFilled = bestListing?.accepts_beginners != null;
    } else if (field.key === 'deposit_required') {
      isFilled = bestListing?.deposit_required != null;
    } else {
      isFilled = Boolean(bestListing?.[field.key]);
    }

    if (isFilled) {
      earned += field.weight;
      filled.push(field.key);
    } else {
      missing.push({ key: field.key, label: field.label, category: field.category, weight: field.weight });
    }
  }

  // Sort missing by weight (highest value first = biggest completeness gain)
  missing.sort((a, b) => b.weight - a.weight);

  const score = Math.round((earned / MAX_SCORE) * 100);

  return { score, filled, missing };
}

/**
 * Get the top N missing fields a provider should fill next.
 * Returns the highest-weight missing fields as actionable nudges.
 */
export function getNextSteps(profile, listings = [], media = [], count = 3) {
  const { missing } = calculateCompleteness(profile, listings, media);
  return missing.slice(0, count);
}
