import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import { getLocationsGrouped } from '../../services/locations';
import { slugify } from '../../utils/slugify';
import { Search, MapPin, TrendingUp, Star, Users, ChevronRight } from 'lucide-react';

// City images mapping for popular cities
const cityImages = {
  'Toronto': 'https://images.unsplash.com/photo-1517090504850-2937583e46c7?w=400&h=500&fit=crop',
  'Vancouver': 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=400&h=500&fit=crop',
  'Montreal': 'https://images.unsplash.com/photo-1519178555425-500501f1507b?w=400&h=500&fit=crop',
  'New York': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=500&fit=crop',
  'Los Angeles': 'https://images.unsplash.com/photo-1503891450247-ee5f8ec46dc3?w=400&h=500&fit=crop',
  'Chicago': 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=500&fit=crop',
  'Miami': 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=400&h=500&fit=crop',
  'Seattle': 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=400&h=500&fit=crop',
  'Houston': 'https://images.unsplash.com/photo-1470082719408-b2843ab5c9ab?w=400&h=500&fit=crop',
  'Las Vegas': 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=400&h=500&fit=crop',
};

const getCityImage = (cityName) => {
  return cityImages[cityName] || `https://source.unsplash.com/400x500/?city,${encodeURIComponent(cityName)}`;
};

export async function getServerSideProps() {
  try {
    const { grouped, error } = await getLocationsGrouped();

    if (error) {
      console.error('Error loading locations:', error);
      return {
        props: {
          initialLocations: null,
          error: 'Failed to load locations. Please try again.',
        }
      };
    }

    return {
      props: {
        initialLocations: grouped || {},
        error: null,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialLocations: null,
        error: 'An unexpected error occurred.',
      },
    };
  }
}

export default function CitiesDirectory({ initialLocations, error }) {
  const [locationsData] = useState({
    locations: initialLocations,
    loading: false,
    error: error
  });

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeState, setActiveState] = useState(null);
  const [cityUpdatesEmail, setCityUpdatesEmail] = useState('');
  const [providerWaitlistEmail, setProviderWaitlistEmail] = useState('');
  const [signupMessage, setSignupMessage] = useState({ city: null, provider: null });
  const [submitting, setSubmitting] = useState({ city: false, provider: false });

  // Initialize selectedCountry
  useEffect(() => {
    if (initialLocations && Object.keys(initialLocations).length > 0) {
      setSelectedCountry(Object.keys(initialLocations)[0]);
    }
  }, [initialLocations]);

  // Filter locations based on search term
  const filteredLocations = {};
  if (locationsData.locations) {
    Object.entries(locationsData.locations).forEach(([country, states]) => {
      filteredLocations[country] = {};

      Object.entries(states).forEach(([state, cities]) => {
        const filteredCities = cities.filter(city =>
          city.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          state.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filteredCities.length > 0) {
          filteredLocations[country][state] = filteredCities;
        }
      });

      if (Object.keys(filteredLocations[country]).length === 0) {
        delete filteredLocations[country];
      }
    });
  }

  // Get all cities flattened for list and stat calculations
  const getAllCities = (query = '') => {
    const cities = [];
    const normalizedQuery = query.trim().toLowerCase();
    const hasQuery = normalizedQuery.length > 0;
    if (locationsData.locations) {
      Object.entries(locationsData.locations).forEach(([country, states]) => {
        Object.entries(states).forEach(([state, stateCities]) => {
          stateCities.forEach(city => {
            const matchesQuery =
              !hasQuery ||
              city.city.toLowerCase().includes(normalizedQuery) ||
              state.toLowerCase().includes(normalizedQuery);
            if (matchesQuery) {
              cities.push({ ...city, country, state });
            }
          });
        });
      });
    }
    return cities;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled reactively by the filter
  };

  const getUtmContext = () => {
    if (typeof window === 'undefined') {
      return { utm_source: null, utm_medium: null, utm_campaign: null };
    }

    const params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
    };
  };

  const subscribe = async ({ email, type, citySlug = null }) => {
    const response = await fetch('/api/waitlist/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        subscriptionType: type,
        citySlug,
        sourcePage: '/cities',
        ...getUtmContext(),
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result?.error || 'Unable to subscribe');
    }
  };

  const handleCitySignup = async (e) => {
    e.preventDefault();
    setSubmitting((prev) => ({ ...prev, city: true }));
    setSignupMessage((prev) => ({ ...prev, city: null }));

    try {
      const citySlug = searchTerm.trim() ? slugify(searchTerm.trim()) : null;
      await subscribe({
        email: cityUpdatesEmail,
        type: 'city_updates',
        citySlug,
      });
      setCityUpdatesEmail('');
      setSignupMessage((prev) => ({
        ...prev,
        city: { type: 'success', text: 'Subscribed. We will email city updates.' },
      }));
    } catch (signupError) {
      setSignupMessage((prev) => ({
        ...prev,
        city: { type: 'error', text: signupError.message },
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, city: false }));
    }
  };

  const handleProviderSignup = async (e) => {
    e.preventDefault();
    setSubmitting((prev) => ({ ...prev, provider: true }));
    setSignupMessage((prev) => ({ ...prev, provider: null }));

    try {
      await subscribe({
        email: providerWaitlistEmail,
        type: 'provider_waitlist',
      });
      setProviderWaitlistEmail('');
      setSignupMessage((prev) => ({
        ...prev,
        provider: { type: 'success', text: 'You are on the founding provider waitlist.' },
      }));
    } catch (signupError) {
      setSignupMessage((prev) => ({
        ...prev,
        provider: { type: 'error', text: signupError.message },
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, provider: false }));
    }
  };

  const allCities = getAllCities();
  const displayCities = searchTerm ? getAllCities(searchTerm) : [];
  const isSearching = searchTerm.length > 0;
  const popularCities = allCities
    .filter((city) => city.listingCount > 0)
    .sort((a, b) => b.listingCount - a.listingCount)
    .slice(0, 5);
  const totalActiveListings = allCities.reduce(
    (acc, city) => acc + (city.listingCount || 0),
    0
  );

  return (
    <Layout>
      <Head>
        <title>Browse Cities | DommeDirectory</title>
        <meta name="description" content="Browse dommes by city across North America" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a]">
        
        {/* Search Bar Section - Matches Homepage */}
        <div className="bg-[#111] border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search cities..."
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
            
            {/* Left Column - Cities Grid */}
            <div className="flex-1">
              
              {/* Error State */}
              {locationsData.error ? (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-200">
                  {locationsData.error}
                </div>
              ) : isSearching ? (
                // Search Results
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white text-lg font-medium">
                      Search Results ({displayCities.length} cities)
                    </h2>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-400 hover:text-white text-sm"
                    >
                      Clear search
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {displayCities.map((city) => (
                      <CityCard key={city.id} city={city} showState />
                    ))}
                  </div>
                  
                  {displayCities.length === 0 && (
                    <div className="text-center py-12 text-gray-400">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No cities found matching &quot;{searchTerm}&quot;</p>
                    </div>
                  )}
                </>
              ) : (
                // Browse by Country
                <>
                  {/* Country Tabs */}
                  <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {Object.keys(filteredLocations).map(country => (
                      <button
                        key={country}
                        onClick={() => {
                          setSelectedCountry(country);
                          setActiveState(null);
                        }}
                        className={`
                          px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                          ${selectedCountry === country
                            ? 'bg-red-600 text-white'
                            : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-700'}
                        `}
                      >
                        {country}
                      </button>
                    ))}
                  </div>

                  {/* State Filter */}
                  {selectedCountry && filteredLocations[selectedCountry] && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                          onClick={() => setActiveState(null)}
                          className={`
                            px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors
                            ${activeState === null
                              ? 'bg-gray-700 text-white'
                              : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-700'}
                          `}
                        >
                          All States
                        </button>
                        {Object.keys(filteredLocations[selectedCountry]).map(state => (
                          <button
                            key={state}
                            onClick={() => setActiveState(activeState === state ? null : state)}
                            className={`
                              px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors
                              ${activeState === state
                                ? 'bg-gray-700 text-white'
                                : 'bg-[#1a1a1a] text-gray-400 hover:text-white border border-gray-700'}
                            `}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section Title */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white text-lg font-medium">
                      {selectedCountry ? `Cities in ${selectedCountry}` : 'All Cities'}
                    </h2>
                    <span className="text-gray-500 text-sm">
                      {selectedCountry && filteredLocations[selectedCountry]
                        ? Object.values(filteredLocations[selectedCountry]).flat().length
                        : 0} cities
                    </span>
                  </div>

                  {/* Cities Grid */}
                  {selectedCountry && filteredLocations[selectedCountry] && (
                    <div className="space-y-6">
                      {Object.entries(filteredLocations[selectedCountry])
                        .filter(([state]) => !activeState || state === activeState)
                        .map(([state, cities]) => (
                          <div key={state}>
                            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                              {state}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {cities.map((city) => (
                                <CityCard key={city.id} city={city} />
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-80 space-y-6">
              
              {/* Popular Cities */}
              <div className="bg-[#111] rounded-lg p-4 border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-red-600" />
                  <h3 className="text-white font-semibold">Popular Cities</h3>
                </div>
                <div className="space-y-2">
                  {popularCities.length > 0 ? (
                    popularCities.map((city, index) => (
                      <Link
                        key={city.id}
                        href={`/location/${slugify(city.city)}`}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-800 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-gray-600 font-bold text-sm w-4">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-white font-medium text-sm group-hover:text-red-500 transition-colors">
                              {city.city}
                            </p>
                            <p className="text-gray-500 text-xs">{city.country}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                          <Users className="w-3 h-3" />
                          {city.listingCount}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No popular cities yet.</p>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-lg p-4 border border-red-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-red-500" />
                  <h3 className="text-white font-semibold">Directory Stats</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Total Cities</span>
                    <span className="text-white font-bold">
                      {Object.values(locationsData.locations || {}).reduce(
                        (acc, states) => acc + Object.values(states).flat().length, 0
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Countries</span>
                    <span className="text-white font-bold">
                      {Object.keys(locationsData.locations || {}).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">Active Listings</span>
                    <span className="text-white font-bold">{totalActiveListings}</span>
                  </div>
                </div>
              </div>

              {/* Buyer Email Capture */}
              <div className="bg-[#111] rounded-lg p-4 border border-gray-800">
                <h3 className="text-white font-semibold mb-2">Get Updates in Your City</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Receive new verified listing alerts and safety updates.
                </p>
                <form onSubmit={handleCitySignup} className="space-y-2">
                  <input
                    type="email"
                    required
                    value={cityUpdatesEmail}
                    onChange={(e) => setCityUpdatesEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="submit"
                    disabled={submitting.city}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded py-2 transition-colors"
                  >
                    {submitting.city ? 'Submitting...' : 'Subscribe'}
                  </button>
                </form>
                {signupMessage.city && (
                  <p className={`text-xs mt-2 ${signupMessage.city.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {signupMessage.city.text}
                  </p>
                )}
              </div>

              {/* Provider Waitlist Capture */}
              <div className="bg-[#111] rounded-lg p-4 border border-gray-800">
                <h3 className="text-white font-semibold mb-2">Founding Provider Waitlist</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Get early verified placement and tracked lead analytics.
                </p>
                <form onSubmit={handleProviderSignup} className="space-y-2">
                  <input
                    type="email"
                    required
                    value={providerWaitlistEmail}
                    onChange={(e) => setProviderWaitlistEmail(e.target.value)}
                    placeholder="provider@email.com"
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-600"
                  />
                  <button
                    type="submit"
                    disabled={submitting.provider}
                    className="w-full bg-[#1a1a1a] hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium rounded py-2 transition-colors border border-gray-700"
                  >
                    {submitting.provider ? 'Joining...' : 'Join Waitlist'}
                  </button>
                </form>
                {signupMessage.provider && (
                  <p className={`text-xs mt-2 ${signupMessage.provider.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {signupMessage.provider.text}
                  </p>
                )}
              </div>

              {/* Create Listing CTA */}
              <div className="bg-[#111] rounded-lg p-4 border border-gray-800">
                <h3 className="text-white font-semibold mb-2">Are you a Domme?</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Create your listing and get discovered by clients in your city.
                </p>
                <Link
                  href="/listings/create"
                  className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded font-medium transition-colors"
                >
                  Create Listing
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Browse All Link */}
              <Link
                href="/"
                className="flex items-center justify-center gap-2 w-full bg-[#1a1a1a] hover:bg-gray-800 text-gray-300 py-2 rounded font-medium transition-colors border border-gray-700"
              >
                <MapPin className="w-4 h-4" />
                Browse All Listings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// City Card Component
function CityCard({ city, showState = false }) {
  const cityImage = getCityImage(city.city);

  return (
    <Link
      href={`/location/${slugify(city.city)}`}
      className="group relative bg-[#1a1a1a] rounded-lg overflow-hidden hover:ring-2 hover:ring-red-600 transition-all"
    >
      {/* Image */}
      <div className="aspect-[4/5] relative">
        <img
          src={cityImage}
          alt={city.city}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=500&fit=crop';
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-white font-bold text-lg">{city.city}</h3>
          {showState && (
            <p className="text-gray-400 text-xs">{city.state}, {city.country}</p>
          )}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-red-500 text-xs font-medium">{city.listingCount || 0} listings</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
