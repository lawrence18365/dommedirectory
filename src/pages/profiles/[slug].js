import ProfileDetail, { getListingPagePropsById } from '../listings/[id]';
import { buildProfilePath, buildProfileSlug } from '../../utils/profileSlug';
import { isSupabaseConfigured, supabase } from '../../utils/supabase';
import { getListingRating } from '../../services/reviews';

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

const resolveListingIdLegacy = async (slug) => {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      is_active,
      created_at,
      updated_at,
      profiles(display_name),
      locations(city, state)
    `)
    .limit(5000);

  if (error) throw error;

  const matches = (data || []).filter((listing) => buildProfileSlug(listing) === slug);
  if (matches.length === 0) return { listingId: null, fromHistory: false };

  matches.sort((a, b) => {
    const activeDiff = Number(Boolean(b.is_active)) - Number(Boolean(a.is_active));
    if (activeDiff !== 0) return activeDiff;

    const updatedDiff = new Date(b.updated_at || b.created_at || 0).getTime()
      - new Date(a.updated_at || a.created_at || 0).getTime();
    if (updatedDiff !== 0) return updatedDiff;

    return String(a.id).localeCompare(String(b.id));
  });

  return { listingId: matches[0].id, fromHistory: false };
};

const resolveListingIdFromSlug = async (slug) => {
  const { data: directMatch, error: directError } = await supabase
    .from('listings')
    .select('id, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (directError) {
    if (directError.code === '42703') {
      return resolveListingIdLegacy(slug);
    }
    throw directError;
  }
  if (directMatch?.id) {
    return { listingId: directMatch.id, fromHistory: false };
  }

  const { data: historicalMatch, error: historicalError } = await supabase
    .from('listing_slug_history')
    .select('listing_id')
    .eq('slug', slug)
    .maybeSingle();

  if (historicalError) {
    if (historicalError.code === '42P01') {
      return { listingId: null, fromHistory: false };
    }
    throw historicalError;
  }
  if (historicalMatch?.listing_id) {
    return { listingId: historicalMatch.listing_id, fromHistory: true };
  }

  return { listingId: null, fromHistory: false };
};

export async function getServerSideProps(context) {
  const slug = String(context.params?.slug || '').trim().toLowerCase();
  if (!slug) return { notFound: true };

  if (!isSupabaseConfigured) {
    return {
      props: {
        listing: null,
        similarListings: [],
        error: 'Listing data is unavailable until Supabase is configured.',
      },
    };
  }

  try {
    const { listingId, fromHistory } = await resolveListingIdFromSlug(slug);
    if (!listingId) return { notFound: true };

    const [result, { average: ratingAverage, count: ratingCount }] = await Promise.all([
      getListingPagePropsById(listingId),
      getListingRating(listingId),
    ]);

    if (result.notFound) return { notFound: true };

    if (!result.listing) {
      return {
        props: {
          listing: result.listing,
          similarListings: result.similarListings,
          error: result.error,
          ratingData: null,
        },
      };
    }

    const canonicalPath = buildProfilePath(result.listing);
    if (fromHistory || canonicalPath !== `/profiles/${slug}`) {
      return {
        redirect: {
          destination: appendQueryString(canonicalPath, context.query, 'slug'),
          permanent: true,
        },
      };
    }

    return {
      props: {
        listing: result.listing,
        similarListings: result.similarListings,
        error: result.error,
        ratingData: ratingCount > 0 ? { average: ratingAverage, count: ratingCount } : null,
      },
    };
  } catch (error) {
    console.error('Error resolving profile slug:', error);
    return {
      props: {
        listing: null,
        similarListings: [],
        error: 'Failed to load listing data',
      },
    };
  }
}

export default ProfileDetail;
