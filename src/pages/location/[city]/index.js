import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';
import SEO from '../../../components/ui/SEO';
import { getLocationBySlug, getListingsByLocation } from '../../../services/locations';
import { buildProfilePath } from '../../../utils/profileSlug';
import { ALL_SERVICES, slugifyService } from '../../../utils/services';
import { GUIDES } from '../../../data/guides';

export async function getServerSideProps(context) {
  const { city } = context.params;

  const { location, error: locationError } = await getLocationBySlug(city);

  if (locationError || !location) {
    return { notFound: true };
  }

  const { listings, error: listingsError } = await getListingsByLocation(location.id);

  if (listingsError) {
    return {
      props: {
        location,
        listings: [],
        error: 'Failed to load listings for this location.',
      },
    };
  }

  return {
    props: {
      location,
      listings: listings || [],
      error: null,
    },
  };
}

const RELEVANT_GUIDES = GUIDES.slice(0, 3);

export default function CityLocation({ location, listings, error }) {
  const router = useRouter();

  if (!location) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 p-4 rounded-md">
            <p className="text-yellow-700">Location not found.</p>
            <Link href="/cities" className="mt-4 text-purple-700 block">
              &larr; Browse all cities
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const locationStr = [location.city, location.state].filter(Boolean).join(', ');
  const listingCount = listings.length;
  const metaDescription = listingCount > 0
    ? `Browse ${listingCount} professional domme${listingCount === 1 ? '' : 's'} in ${locationStr}. Find verified BDSM, domination, and fetish services near you.`
    : `Discover professional dommes in ${locationStr} on DommeDirectory. Browse verified profiles and services.`;

  const citySlug = router.query.city;
  const pageUrl = `https://dommedirectory.com/location/${citySlug}`;

  // JSON-LD: ItemList for rich directory results
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Professional Dommes in ${locationStr}`,
    description: metaDescription,
    url: pageUrl,
    numberOfItems: listingCount,
    itemListElement: listings.slice(0, 10).map((listing, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: listing.title,
      url: `https://dommedirectory.com${buildProfilePath(listing)}`,
      ...(listing.primaryImage ? { image: listing.primaryImage } : {}),
    })),
  };

  // JSON-LD: BreadcrumbList for navigation trail
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://dommedirectory.com' },
      { '@type': 'ListItem', position: 2, name: 'Cities', item: 'https://dommedirectory.com/cities' },
      { '@type': 'ListItem', position: 3, name: location.city, item: pageUrl },
    ],
  };

  const combinedJsonLd = [itemListSchema, breadcrumbSchema];

  return (
    <Layout>
      <SEO
        title={`${listingCount} Dommes in ${locationStr} — Verified Profiles (${new Date().getFullYear()})`}
        description={metaDescription}
        canonical={pageUrl}
        jsonLd={combinedJsonLd}
        geo={{ city: location.city, state: location.state, country: location.country }}
      />

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cities" className="text-purple-700">
            &larr; Browse all cities
          </Link>
          <h1 className="text-3xl font-bold text-purple-900 mt-2">
            Dommes in {locationStr}
          </h1>
          <p className="text-gray-600 mt-2">
            {listingCount} {listingCount === 1 ? 'domme' : 'dommes'} available in this area
          </p>
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {listingCount === 0 ? (
          <div className="space-y-8">
            {/* Intro */}
            <section className="bg-[#1a1a1a] rounded-lg p-8 border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-4">
                Professional Domination Services in {location.city}
              </h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                DommeDirectory is building a verified directory of professional dommes in {locationStr}. While there are no listings in {location.city} yet, providers are joining every week. Browse the service categories below to see what&apos;s available, or check back soon.
              </p>
              <p className="text-gray-300 leading-relaxed">
                If you&apos;re a professional domme based in or serving {location.city}, you can create a free listing to be among the first verified providers in your area.
              </p>
            </section>

            {/* Service links grid */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">
                Browse Services in {location.city}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {ALL_SERVICES.map((service) => {
                  const slug = slugifyService(service);
                  return (
                    <Link
                      key={slug}
                      href={`/location/${citySlug}/${slug}`}
                      className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800 hover:border-red-600/40 transition-colors text-center"
                    >
                      <span className="text-gray-300 text-sm font-medium hover:text-white transition-colors">
                        {service}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Guide links */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">
                Guides for Getting Started
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {RELEVANT_GUIDES.map((guide) => (
                  <Link
                    key={guide.slug}
                    href={`/guide/${guide.slug}`}
                    className="bg-[#1a1a1a] rounded-lg p-5 border border-gray-800 hover:border-red-600/40 transition-colors group"
                  >
                    <h3 className="text-white font-semibold text-sm group-hover:text-red-400 transition-colors mb-2">
                      {guide.title}
                    </h3>
                    <p className="text-gray-500 text-xs line-clamp-2">
                      {guide.metaDescription}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* CTA */}
            <div className="bg-[#1a1a1a] rounded-lg p-8 text-center border border-gray-800">
              <h2 className="text-xl font-medium text-white mb-3">
                Are you a provider in {location.city}?
              </h2>
              <p className="text-gray-400 mb-6">
                Be the first to create a verified listing in {location.city} and reach clients searching in your area.
              </p>
              <Link
                href="/auth/register"
                className="inline-block bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Create Your Listing
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div key={listing.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="relative h-64 w-full bg-gray-200">
                  {listing.primaryImage ? (
                    <img
                      src={listing.primaryImage}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}

                  {(listing.profiles?.premium_tier === 'pro' || listing.profiles?.premium_tier === 'elite') ? (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold text-xs px-2 py-1 rounded shadow-lg border border-yellow-400 z-10">
                      PRO
                    </div>
                  ) : listing.profiles?.is_verified ? (
                    <div className="absolute top-2 right-2 bg-red-600 text-white font-bold text-xs px-2 py-1 rounded shadow z-10">
                      Verified
                    </div>
                  ) : (listing.is_featured_effective || listing.is_featured) ? (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white font-bold text-xs px-2 py-1 rounded shadow z-10">
                      Featured
                    </div>
                  ) : null}
                </div>

                <div className="p-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2 truncate">
                    {listing.title}
                  </h2>
                  <p className="text-purple-700 font-medium mb-2">
                    {listing.profiles?.display_name || 'Unclaimed Listing'}
                  </p>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {listing.description}
                  </p>
                  <Link
                    href={buildProfilePath({
                      ...listing,
                      city: location.city,
                      state: location.state,
                    })}
                    className="block w-full text-center bg-purple-700 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-800 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
