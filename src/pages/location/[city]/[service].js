import Link from 'next/link';
import Layout from '../../../components/layout/Layout';
import SEO, { generateBreadcrumbSchema } from '../../../components/ui/SEO';
import { supabase, isSupabaseConfigured } from '../../../utils/supabase';
import { getLocationBySlug } from '../../../services/locations';
import { ALL_SERVICES, SERVICE_BY_SLUG, slugifyService } from '../../../utils/services';
import { buildProfilePath } from '../../../utils/profileSlug';

export async function getServerSideProps(context) {
  const { city: citySlug, service: serviceSlug } = context.params;
  const serviceName = SERVICE_BY_SLUG[serviceSlug];

  if (!serviceName) {
    return { notFound: true };
  }

  if (!isSupabaseConfigured) {
    return {
      props: { location: null, serviceName, serviceSlug, listings: [] },
    };
  }

  const { location, error: locationError } = await getLocationBySlug(citySlug);

  if (locationError || !location) {
    return { notFound: true };
  }

  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, slug, title, description, is_featured, services,
      profiles(id, display_name, profile_picture_url, is_verified, premium_tier),
      locations!inner(id, city, state, country),
      media(storage_path, is_primary)
    `)
    .eq('is_active', true)
    .eq('location_id', location.id)
    .filter(`services->>${serviceName}`, 'eq', 'true')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Location+service page query error:', error);
    return {
      props: { location, serviceName, serviceSlug, listings: [], otherServices: [] },
    };
  }

  const listings = (data || []).map((l) => {
    const primaryMedia = l.media?.find((m) => m.is_primary) || l.media?.[0];
    return {
      ...l,
      primaryImage: primaryMedia?.storage_path || l.profiles?.profile_picture_url || null,
      media: undefined,
    };
  });

  // Build other-services counts from the same location's listings
  const { data: cityAll } = await supabase
    .from('listings')
    .select('services')
    .eq('is_active', true)
    .eq('location_id', location.id)
    .limit(300);

  const otherServiceCounts = {};
  (cityAll || []).forEach((l) => {
    Object.entries(l.services || {}).forEach(([svc, on]) => {
      if (on && svc !== serviceName) {
        otherServiceCounts[svc] = (otherServiceCounts[svc] || 0) + 1;
      }
    });
  });
  const otherServices = Object.entries(otherServiceCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, slug: slugifyService(name) }));

  return {
    props: { location, serviceName, serviceSlug, listings, otherServices },
  };
}

export default function LocationServicePage({ location, serviceName, serviceSlug, listings, otherServices = [] }) {
  if (!location) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-16 px-4 text-center">
          <p className="text-gray-400">Location not found.</p>
          <Link href="/cities" className="mt-4 text-red-400 block">Browse all cities</Link>
        </div>
      </Layout>
    );
  }

  const locationStr = [location.city, location.state].filter(Boolean).join(', ');
  const listingCount = listings.length;
  const citySlug = location.city.toLowerCase().replace(/\s+/g, '-');

  const metaDescription = listingCount > 0
    ? `Find ${listingCount} professional domme${listingCount === 1 ? '' : 's'} offering ${serviceName} in ${locationStr}. Browse verified profiles, rates, and reviews.`
    : `Find professional dommes offering ${serviceName} in ${locationStr} on DommeDirectory.`;

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: 'Home', url: 'https://dommedirectory.com' },
      { name: 'Locations', url: 'https://dommedirectory.com/cities' },
      { name: location.city, url: `https://dommedirectory.com/location/${citySlug}` },
      { name: serviceName, url: `https://dommedirectory.com/location/${citySlug}/${serviceSlug}` },
    ]),
  ];

  return (
    <Layout>
      <SEO
        title={`${serviceName} Dommes in ${locationStr}`}
        description={metaDescription}
        canonical={`https://dommedirectory.com/location/${citySlug}/${serviceSlug}`}
        geo={{ city: location.city, state: location.state, country: location.country }}
        jsonLd={jsonLd}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/cities" className="hover:text-white transition-colors">Locations</Link>
          <span className="mx-2">/</span>
          <Link href={`/location/${citySlug}`} className="hover:text-white transition-colors">{location.city}</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-300">{serviceName}</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            {serviceName} Dommes in {locationStr}
          </h1>
          <p className="text-gray-400 mt-2">
            {listingCount > 0
              ? `${listingCount} provider${listingCount === 1 ? '' : 's'} available`
              : `No listings yet for ${serviceName} in ${location.city}`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Listings */}
          <div className="lg:col-span-3">
            {listingCount === 0 ? (
              <div className="bg-[#1a1a1a] rounded-lg p-8 text-center border border-gray-800">
                <h2 className="text-xl font-medium text-white mb-3">No listings yet</h2>
                <p className="text-gray-400 mb-4">
                  Be the first to offer {serviceName} in {location.city}.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/auth/register"
                    className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Create Your Listing
                  </Link>
                  <Link
                    href={`/location/${citySlug}`}
                    className="inline-block bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    All dommes in {location.city}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link key={listing.id} href={buildProfilePath(listing)} className="group block">
                    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800 hover:border-red-600/40 transition-colors">
                      <div className="relative h-48 bg-gray-800">
                        {listing.primaryImage ? (
                          <img
                            src={listing.primaryImage}
                            alt={listing.profiles?.display_name || listing.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-600">No photo</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        {(listing.profiles?.premium_tier === 'pro' || listing.profiles?.premium_tier === 'elite') ? (
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold text-xs px-2 py-0.5 rounded shadow-lg border border-yellow-400 z-10">
                            PRO
                          </div>
                        ) : listing.profiles?.is_verified ? (
                          <div className="absolute top-2 right-2 bg-red-600 text-white font-bold text-xs px-2 py-0.5 rounded shadow z-10">
                            Verified
                          </div>
                        ) : listing.is_featured ? (
                          <div className="absolute top-2 right-2 bg-purple-600 text-white font-bold text-xs px-2 py-0.5 rounded z-10">
                            Featured
                          </div>
                        ) : null}
                      </div>
                      <div className="p-4">
                        <h2 className="text-white font-semibold truncate group-hover:text-red-400 transition-colors">
                          {listing.profiles?.display_name || listing.title}
                        </h2>
                        <p className="text-gray-400 text-sm mt-0.5">{locationStr}</p>
                        {listing.description && (
                          <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                            {listing.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Other services in this city — with counts */}
            <div className="bg-[#1a1a1a] rounded-lg p-5 border border-gray-800">
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
                More in {location.city}
              </h3>
              <Link
                href={`/location/${citySlug}`}
                className="text-red-500 hover:text-red-400 transition-colors text-sm block mb-3"
              >
                All dommes in {location.city} →
              </Link>
              <ul className="space-y-1.5">
                {(otherServices.length > 0 ? otherServices : ALL_SERVICES.filter((s) => s !== serviceName).map((name) => ({ name, count: 0, slug: slugifyService(name) }))).slice(0, 12).map(({ name, count: c, slug }) => (
                  <li key={name}>
                    <Link
                      href={`/location/${citySlug}/${slug}`}
                      className="flex items-center justify-between text-gray-500 hover:text-gray-300 transition-colors text-sm"
                    >
                      <span>{name}</span>
                      {c > 0 && <span className="text-gray-600 text-xs">{c}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Same service, all cities */}
            <div className="bg-[#1a1a1a] rounded-lg p-5 border border-gray-800">
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
                {serviceName} elsewhere
              </h3>
              <Link
                href={`/services/${serviceSlug}`}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                All {serviceName} providers →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
