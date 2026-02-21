import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import SEO, { generateBreadcrumbSchema } from '../../components/ui/SEO';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { ALL_SERVICES, SERVICE_BY_SLUG, slugifyService } from '../../utils/services';
import { buildProfilePath } from '../../utils/profileSlug';

export async function getServerSideProps(context) {
  const { service: serviceSlug } = context.params;
  const serviceName = SERVICE_BY_SLUG[serviceSlug];

  if (!serviceName) {
    return { notFound: true };
  }

  if (!isSupabaseConfigured) {
    return {
      props: { serviceName, serviceSlug, listings: [], locationMap: {} },
    };
  }

  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, slug, title, description,
      profiles(id, display_name, profile_picture_url, is_verified, premium_tier),
      locations!inner(id, city, state, country),
      media(storage_path, is_primary)
    `)
    .eq('is_active', true)
    .filter(`services->>${serviceName}`, 'eq', 'true')
    .order('created_at', { ascending: false })
    .limit(60);

  if (error) {
    console.error('Service page query error:', error);
    return {
      props: { serviceName, serviceSlug, listings: [], locationMap: {} },
    };
  }

  const listings = (data || []).map((l) => {
    const primaryMedia = l.media?.find((m) => m.is_primary) || l.media?.[0];
    return {
      ...l,
      primaryImage: primaryMedia?.storage_path || null,
      media: undefined,
    };
  });

  // Build city → count map for "also available in" links
  const locationMap = listings.reduce((acc, l) => {
    const city = l.locations?.city;
    if (city) acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});

  return {
    props: {
      serviceName,
      serviceSlug,
      listings,
      locationMap,
    },
  };
}

export default function ServicePage({ serviceName, serviceSlug, listings, locationMap }) {
  const listingCount = listings.length;
  const cities = Object.keys(locationMap).sort((a, b) => locationMap[b] - locationMap[a]);

  const metaDescription = listingCount > 0
    ? `Find ${listingCount} professional domme${listingCount === 1 ? '' : 's'} offering ${serviceName} on DommeDirectory. Browse verified profiles, rates, and reviews.`
    : `Find professional dommes offering ${serviceName} on DommeDirectory. Browse verified profiles and book a session.`;

  const jsonLd = [
    generateBreadcrumbSchema([
      { name: 'Home', url: 'https://dommedirectory.com' },
      { name: 'Services', url: 'https://dommedirectory.com/cities' },
      { name: serviceName, url: `https://dommedirectory.com/services/${serviceSlug}` },
    ]),
  ];

  return (
    <Layout>
      <SEO
        title={`${serviceName} Dommes`}
        description={metaDescription}
        canonical={`https://dommedirectory.com/services/${serviceSlug}`}
        jsonLd={jsonLd}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm text-gray-500 mb-3">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/cities" className="hover:text-white transition-colors">Locations</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-300">{serviceName}</span>
          </nav>

          <h1 className="text-3xl font-bold text-white">
            {serviceName} Dommes
          </h1>
          <p className="text-gray-400 mt-2">
            {listingCount > 0
              ? `${listingCount} provider${listingCount === 1 ? '' : 's'} offering ${serviceName}`
              : `No listings yet for ${serviceName}`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main listings grid */}
          <div className="lg:col-span-3">
            {listingCount === 0 ? (
              <div className="bg-[#1a1a1a] rounded-lg p-8 text-center border border-gray-800">
                <h2 className="text-xl font-medium text-white mb-3">No listings yet</h2>
                <p className="text-gray-400 mb-6">
                  Be the first to create a {serviceName} listing.
                </p>
                <Link
                  href="/auth/register"
                  className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Create Your Listing
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link key={listing.id} href={buildProfilePath(listing)} className="group block">
                    <div className="bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors">
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {(listing.profiles?.premium_tier === 'pro' || listing.profiles?.premium_tier === 'elite') ? (
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold text-xs px-2 py-0.5 rounded shadow-lg border border-yellow-400">
                            PRO
                          </div>
                        ) : listing.profiles?.is_verified ? (
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded shadow">
                            Verified
                          </div>
                        ) : null}
                      </div>
                      <div className="p-4">
                        <h2 className="text-white font-semibold truncate">
                          {listing.profiles?.display_name || listing.title}
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                          {listing.locations?.city}{listing.locations?.state ? `, ${listing.locations.state}` : ''}
                        </p>
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
            {/* Cities offering this service */}
            {cities.length > 0 && (
              <div className="bg-[#1a1a1a] rounded-lg p-5 border border-gray-800">
                <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
                  Cities
                </h3>
                <ul className="space-y-2">
                  {cities.slice(0, 15).map((city) => {
                    const listing = listings.find((l) => l.locations?.city === city);
                    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <li key={city}>
                        <Link
                          href={`/location/${citySlug}/${serviceSlug}`}
                          className="flex items-center justify-between text-gray-400 hover:text-white transition-colors text-sm"
                        >
                          <span>{city}</span>
                          <span className="text-gray-600">{locationMap[city]}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Other services */}
            <div className="bg-[#1a1a1a] rounded-lg p-5 border border-gray-800">
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
                Other Services
              </h3>
              <ul className="space-y-2">
                {ALL_SERVICES.filter((s) => s !== serviceName).map((s) => (
                  <li key={s}>
                    <Link
                      href={`/services/${slugifyService(s)}`}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {s}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
