import { useState } from 'react';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import SEO, { generateWebsiteSchema, generateOrganizationSchema } from '../components/ui/SEO';
import { Search, MapPin, Video, Star, Heart } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { buildProfilePath } from '../utils/profileSlug';

function mapListingsForHomepage(listings = []) {
  return listings.map((listing) => {
    const primaryMedia = listing.media?.find((m) => m.is_primary) || listing.media?.[0];
    return {
      id: listing.id,
      slug: listing.slug || '',
      display_name: listing.profiles?.display_name || 'Anonymous',
      city: listing.locations?.city || 'Unknown',
      state: listing.locations?.state || '',
      country: listing.locations?.country || '',
      profile_picture_url: primaryMedia?.storage_path || listing.profiles?.profile_picture_url || null,
      is_verified: Boolean(listing.profiles?.is_verified),
      is_pro: listing.profiles?.premium_tier === 'pro' || listing.profiles?.premium_tier === 'elite',
      title: listing.title || '',
      description: listing.description || '',
    };
  });
}

function mapPopularCities(cityRows = []) {
  const cityMap = new Map();
  cityRows.forEach((row) => {
    if (!row.location_id || !row.locations) return;
    const current = cityMap.get(row.location_id) || {
      name: row.locations.city,
      country: row.locations.country,
      count: 0,
    };
    current.count += 1;
    cityMap.set(row.location_id, current);
  });

  return [...cityMap.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);
}

export async function getServerSideProps() {
  if (!isSupabaseConfigured) {
    return {
      props: {
        initialDommes: [],
        initialPopularCities: [],
        fetchError: 'Listings are unavailable until Supabase is configured.',
      },
    };
  }

  try {
    const [listingsResult, cityCountsResult] = await Promise.all([
      supabase
        .from('listings')
        .select(`
          *,
          *,
          profiles!inner(id, display_name, profile_picture_url, is_verified, premium_tier),
          locations!inner(city, state, country),
          media(storage_path, is_primary)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('listings')
        .select('location_id, locations!inner(city, country)')
        .eq('is_active', true),
    ]);

    if (listingsResult.error) throw listingsResult.error;
    if (cityCountsResult.error) throw cityCountsResult.error;

    return {
      props: {
        initialDommes: mapListingsForHomepage(listingsResult.data || []),
        initialPopularCities: mapPopularCities(cityCountsResult.data || []),
        fetchError: null,
      },
    };
  } catch (error) {
    console.error('Error fetching homepage listings:', error);
    return {
      props: {
        initialDommes: [],
        initialPopularCities: [],
        fetchError: 'Unable to load featured listings right now.',
      },
    };
  }
}

export default function Home({ initialDommes, initialPopularCities, fetchError }) {
  const [searchQuery, setSearchQuery] = useState('');
  const dommes = initialDommes || [];
  const popularCities = initialPopularCities || [];

  const handleSearch = (e) => {
    e.preventDefault();
    // Redirect to search page with query
    window.location.href = `/cities?q=${encodeURIComponent(searchQuery)}`;
  };

  const featuredListing = dommes[0] || null;

  return (
    <Layout>
      <SEO
        title="Find a Dominatrix Near You — Verified Listings | DommeDirectory"
        description="Browse verified professional dominatrices and mistresses across the US and Canada. Search by city: Toronto, New York, Los Angeles, London & more. Direct contact, real profiles."
        canonical="https://dommedirectory.com"
        jsonLd={[generateWebsiteSchema(), generateOrganizationSchema()]}
      />

      {/* Dark Background */}
      <div className="min-h-screen bg-[#0a0a0a]">

        {/* Above-the-fold H1 — visible, high-authority, keyword-bearing */}
        <div className="bg-[#0d0d0d] border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 pt-6 pb-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Find Verified Dominatrices Near You
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Professional dommes and mistresses in major cities across the US and Canada.
              Verified profiles. Direct contact.
            </p>
          </div>
        </div>

        {/* Search Bar Section */}
        <div className="bg-[#111] border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search in all locations"
                  className="w-full bg-[#1a1a1a] text-white placeholder-gray-500 px-4 py-3 rounded border border-gray-700 focus:outline-none focus:border-red-600"
                />
              </div>
              <button
                type="submit"
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Left Column - Profile Grid */}
            <div className="flex-1">
              {/* Section Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white text-lg font-medium">
                  Featured Listings Near Me
                </h2>
                <Link href="/cities" className="text-gray-400 hover:text-white text-sm">
                  View more
                </Link>
              </div>

              {/* Profile Grid */}
              {dommes.length === 0 ? (
                <div className="bg-[#111] border border-gray-800 rounded-lg p-8 text-center text-gray-400">
                  {fetchError || 'No active listings available yet.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {dommes.map((domme) => (
                    <Link
                      key={domme.id}
                      href={buildProfilePath(domme)}
                      className="group relative bg-[#1a1a1a] rounded-lg overflow-hidden hover:ring-2 hover:ring-red-600 transition-all"
                    >
                      {/* Image */}
                      <div className="aspect-[3/4] relative">
                        {domme.profile_picture_url ? (
                          <img
                            src={domme.profile_picture_url}
                            alt={domme.display_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-800" />
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Verified/Pro Badge */}
                        {domme.is_pro ? (
                          <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold text-xs px-2 py-0.5 rounded shadow-lg border border-yellow-400">
                            PRO
                          </div>
                        ) : domme.is_verified ? (
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded shadow">
                            Verified
                          </div>
                        ) : null}

                        {/* Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="text-white font-semibold text-sm truncate">
                            {domme.display_name}
                          </h3>
                          <p className="text-gray-400 text-xs truncate">
                            {domme.city}, {domme.country}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-80 space-y-6">

              {/* Featured Listing */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-gray-800" />
                  <span className="text-red-600 font-bold text-sm uppercase tracking-wider">
                    Featured Listing
                  </span>
                </div>

                {featuredListing ? (
                  <Link
                    href={buildProfilePath(featuredListing)}
                    className="block relative rounded-lg overflow-hidden group"
                  >
                    <div className="aspect-[3/4]">
                      {featuredListing.profile_picture_url ? (
                        <img
                          src={featuredListing.profile_picture_url}
                          alt={featuredListing.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded uppercase">
                        Featured
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-white font-bold text-lg">
                        {featuredListing.display_name}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {featuredListing.city}, {featuredListing.country}
                      </p>
                      {featuredListing.title && (
                        <p className="text-gray-400 text-xs mt-1 italic truncate">
                          {featuredListing.title}
                        </p>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="bg-[#111] border border-gray-800 rounded-lg p-6 text-center text-gray-400">
                    No featured listing available yet.
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="bg-[#111] rounded-lg p-4 border border-gray-800">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Video className="w-4 h-4 text-red-600" />
                  Explore Videos
                </h3>
                <Link
                  href="/videos"
                  className="block text-center bg-[#1a1a1a] hover:bg-gray-800 text-white py-3 rounded border border-gray-700 transition-colors"
                >
                  Browse Videos
                </Link>
              </div>

              {/* Categories */}
              <div className="bg-[#111] rounded-lg p-4 border border-gray-800">
                <h3 className="text-white font-semibold mb-4">Browse by City</h3>
                <div className="space-y-2">
                  {popularCities.length > 0 ? (
                    popularCities.map((city) => (
                      <Link
                        key={`${city.name}-${city.country}`}
                        href={`/cities?q=${encodeURIComponent(city.name)}`}
                        className="flex items-center justify-between text-gray-400 hover:text-white py-2 px-3 rounded hover:bg-gray-800 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {city.name}
                        </span>
                        <span className="text-xs text-gray-600">{city.count}</span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 px-2">No city stats available yet.</p>
                  )}
                </div>
                <Link
                  href="/cities"
                  className="block text-center text-red-600 hover:text-red-500 text-sm mt-4 py-2 border border-gray-800 rounded hover:border-red-600 transition-colors"
                >
                  View All Cities
                </Link>
              </div>

              {/* Join CTA */}
              <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-lg p-4 border border-red-800/50">
                <h3 className="text-white font-bold text-lg mb-2">Join DommeDirectory</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Create a listing to appear in search results and connect with clients.
                </p>
                <div className="space-y-2">
                  <Link
                    href="/auth/register"
                    className="block w-full bg-red-600 hover:bg-red-700 text-white text-center py-2 rounded font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                  <Link
                    href="/listings/create"
                    className="block w-full bg-[#1a1a1a] hover:bg-gray-800 text-white text-center py-2 rounded font-medium transition-colors border border-gray-700"
                  >
                    Create Listing
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section — internal links for SEO and user navigation */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-white font-semibold mb-5 text-lg">Browse by Service</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Domination', href: '/services/domination' },
                { label: 'Financial Domination', href: '/services/financial-domination' },
                { label: 'CBT', href: '/services/cbt' },
                { label: 'Bondage', href: '/services/bondage' },
                { label: 'Humiliation', href: '/services/humiliation' },
                { label: 'Role Play', href: '/services/role-play' },
                { label: 'Impact Play', href: '/services/impact-play' },
                { label: 'Foot Worship', href: '/services/foot-worship' },
                { label: 'Pegging', href: '/services/pegging' },
                { label: 'Chastity', href: '/services/chastity' },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-gray-700 rounded text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Guides Section — top-of-funnel content for new clients */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-white font-semibold mb-5 text-lg">New Here? Start With These</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'How to Find a Dominatrix',
                  desc: 'Where to look, what to say, what to expect.',
                  href: '/guide/how-to-find-a-dominatrix',
                },
                {
                  title: 'Your First Session',
                  desc: 'What happens before, during, and after.',
                  href: '/guide/what-to-expect-first-session',
                },
                {
                  title: 'BDSM Safety',
                  desc: 'Safewords, negotiation, and aftercare basics.',
                  href: '/guide/bdsm-safety',
                },
                {
                  title: 'What Is Findom?',
                  desc: 'Financial domination explained for newcomers.',
                  href: '/guide/what-is-financial-domination',
                },
              ].map(({ title, desc, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="block bg-[#111] border border-gray-800 rounded-lg p-4 hover:border-red-600/40 hover:bg-[#151515] transition-colors group"
                >
                  <p className="text-white text-sm font-medium group-hover:text-red-400 transition-colors mb-1">{title}</p>
                  <p className="text-gray-500 text-xs">{desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t border-gray-800 mt-0">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-white font-semibold mb-2">Verified Profiles</h3>
                <p className="text-gray-400 text-sm">All profiles are verified to ensure authenticity and safety.</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-white font-semibold mb-2">City Search</h3>
                <p className="text-gray-400 text-sm">Find professional dommes in major cities across North America.</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-white font-semibold mb-2">Direct Connection</h3>
                <p className="text-gray-400 text-sm">Connect directly with dommes through our secure platform.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
