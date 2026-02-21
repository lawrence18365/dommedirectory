import { applyRateLimit } from '../../../utils/rateLimit';
import { getSupabaseAdminClient } from '../../../utils/supabaseAdmin';
import { rankLocationListings } from '../../../utils/listingRanking';
import { isSupabaseConfigured, supabase } from '../../../utils/supabase';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!applyRateLimit(req, res, { maxRequests: 180 })) return;

  const admin = getSupabaseAdminClient();
  const db = admin || (isSupabaseConfigured ? supabase : null);
  if (!db) {
    return res.status(503).json({ error: 'Server is not configured' });
  }

  try {
    const locationId = (req.query.locationId || '').toString().trim();
    if (!locationId) {
      return res.status(400).json({ error: 'locationId is required' });
    }

    const limit = clamp(Number(req.query.limit || 50) || 50, 1, 100);
    const offset = Math.max(0, Number(req.query.offset || 0) || 0);
    const featuredOnly = String(req.query.featured || '').toLowerCase() === 'true';

    const selectWithSlug = `
      id,
      slug,
      profile_id,
      location_id,
      title,
      description,
      services,
      rates,
      is_active,
      is_featured,
      created_at,
      updated_at,
      is_seeded,
      seed_source_url,
      seed_source_label,
      seed_contact_email,
      seed_contact_website,
      seed_contact_handle,
      claimed_at,
      removed_at,
      removed_reason,
      profiles(
        id,
        display_name,
        is_verified,
        verification_tier,
        premium_tier,
        last_active_at
      ),
      media(id, storage_path, is_primary)
    `;

    const selectWithoutSlug = selectWithSlug.replace('slug,\n', '');

    let listingsResponse = await db
      .from('listings')
      .select(selectWithSlug)
      .eq('location_id', locationId)
      .eq('is_active', true)
      .limit(500);

    if (listingsResponse.error?.code === '42703') {
      listingsResponse = await db
        .from('listings')
        .select(selectWithoutSlug)
        .eq('location_id', locationId)
        .eq('is_active', true)
        .limit(500);
    }

    const { data: listings, error: listingsError } = listingsResponse;

    if (listingsError) {
      return res.status(500).json({ error: 'Failed to load location listings' });
    }

    const listingIds = (listings || []).map((listing) => listing.id);
    const profileIds = [
      ...new Set(
        (listings || [])
          .map((listing) => listing.profile_id)
          .filter(Boolean)
      ),
    ];

    let reviews = [];
    if (listingIds.length > 0) {
      const { data: reviewsData, error: reviewsError } = await db
        .from('reviews')
        .select('listing_id, rating')
        .in('listing_id', listingIds)
        .eq('is_approved', true);

      if (!reviewsError) {
        reviews = reviewsData || [];
      }
    }

    let featuredCredits = [];
    if (profileIds.length > 0) {
      const { data: creditsData, error: creditsError } = await db
        .from('featured_credits')
        .select('profile_id, city_id, seconds_granted, seconds_used, created_at')
        .in('profile_id', profileIds);

      if (!creditsError) {
        featuredCredits = creditsData || [];
      }
    }

    const ranked = rankLocationListings({
      listings: listings || [],
      reviews,
      featuredCredits,
      locationId,
    });

    const filtered = featuredOnly
      ? ranked.filter((listing) => listing.is_featured_effective)
      : ranked;
    const paginated = filtered.slice(offset, offset + limit);

    return res.status(200).json({
      listings: paginated,
      total: filtered.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Location listings API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
