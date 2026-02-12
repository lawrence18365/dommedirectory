import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../../components/layout/Layout';
import SEO, { generateWebsiteSchema } from '../../components/ui/SEO';
import { Search, MapPin, TrendingUp, Star, ChevronRight } from 'lucide-react';
import { supabase } from '../../utils/supabase';

// Top US cities for domme services
const usCities = [
  { name: 'New York', state: 'NY', slug: 'new-york', count: 189, image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&h=400&fit=crop' },
  { name: 'Los Angeles', state: 'CA', slug: 'los-angeles', count: 134, image: 'https://images.unsplash.com/photo-1503891450247-ee5f8ec46dc3?w=600&h=400&fit=crop' },
  { name: 'Chicago', state: 'IL', slug: 'chicago', count: 87, image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop' },
  { name: 'Miami', state: 'FL', slug: 'miami', count: 76, image: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=600&h=400&fit=crop' },
  { name: 'Houston', state: 'TX', slug: 'houston', count: 65, image: 'https://images.unsplash.com/photo-1470082719408-b2843ab5c9ab?w=600&h=400&fit=crop' },
  { name: 'Las Vegas', state: 'NV', slug: 'las-vegas', count: 92, image: 'https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?w=600&h=400&fit=crop' },
  { name: 'San Francisco', state: 'CA', slug: 'san-francisco', count: 58, image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=600&h=400&fit=crop' },
  { name: 'Seattle', state: 'WA', slug: 'seattle', count: 43, image: 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=600&h=400&fit=crop' },
  { name: 'Boston', state: 'MA', slug: 'boston', count: 38, image: 'https://images.unsplash.com/photo-1506606401543-2e73709cebb4?w=600&h=400&fit=crop' },
  { name: 'Atlanta', state: 'GA', slug: 'atlanta', count: 41, image: 'https://images.unsplash.com/photo-1575917649705-5b59aaa12e6b?w=600&h=400&fit=crop' },
  { name: 'Dallas', state: 'TX', slug: 'dallas', count: 52, image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=600&h=400&fit=crop' },
  { name: 'Phoenix', state: 'AZ', slug: 'phoenix', count: 29, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop' },
];

const services = [
  'BDSM', 'Bondage', 'Discipline', 'Domination', 'Submission', 
  'Fetish', 'Roleplay', 'CBT', 'Spanking', 'Foot Worship'
];

export default function USAPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUSListings();
  }, []);

  const fetchUSListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          profiles!inner(display_name, profile_picture_url, is_verified),
          locations!inner(city, state, country),
          media(storage_path, is_primary)
        `)
        .eq('is_active', true)
        .eq('locations.country', 'USA')
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) throw error;

      if (data) {
        setListings(data.map(listing => ({
          id: listing.id,
          display_name: listing.profiles?.display_name || 'Anonymous',
          city: listing.locations?.city,
          state: listing.locations?.state,
          image: listing.media?.find(m => m.is_primary)?.storage_path || 
                 listing.media?.[0]?.storage_path || 
                 listing.profiles?.profile_picture_url,
          is_verified: listing.profiles?.is_verified,
        })));
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <SEO 
        title="Professional Dommes in USA - BDSM & Fetish Services"
        description="Find verified professional dommes, mistresses, and BDSM providers in major US cities. New York, Los Angeles, Chicago, Miami, Las Vegas & more. Book sessions with experienced dominatrixes."
        canonical="https://dommedirectory.com/usa"
        jsonLd={[generateWebsiteSchema()]}
      />

      <div className="min-h-screen bg-[#0a0a0a]">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-b from-red-900/20 to-[#0a0a0a] border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Professional Dommes in the <span className="text-red-600">USA</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                Browse verified BDSM, fetish, and domination service providers in major American cities
              </p>
              
              {/* Search */}
              <div className="max-w-md mx-auto">
                <Link 
                  href="/cities"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors justify-center"
                >
                  <Search className="w-5 h-5" />
                  Search US Cities
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Services Tags */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {services.map(service => (
              <span 
                key={service}
                className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded-full text-gray-300 text-sm"
              >
                {service}
              </span>
            ))}
          </div>
        </div>

        {/* US Cities Grid */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <MapPin className="w-6 h-6 text-red-600" />
              Browse by City
            </h2>
            <span className="text-gray-500">{usCities.length} cities</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {usCities.map((city) => (
              <Link
                key={city.slug}
                href={`/location/${city.slug}`}
                className="group relative rounded-lg overflow-hidden hover:ring-2 hover:ring-red-600 transition-all"
              >
                <div className="aspect-[3/2]">
                  <img
                    src={city.image}
                    alt={`${city.name}, ${city.state}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg">{city.name}</h3>
                  <p className="text-gray-300 text-sm">{city.state}</p>
                  <p className="text-red-500 text-xs font-medium mt-1">
                    {city.count} listings
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured US Listings */}
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-red-600" />
              Featured in USA
            </h2>
            <Link href="/cities" className="text-red-600 hover:text-red-500 text-sm flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#1a1a1a] rounded-lg overflow-hidden animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <Link
                  key={listing.id}
                  href={`/listings/${listing.id}`}
                  className="group relative bg-[#1a1a1a] rounded-lg overflow-hidden hover:ring-2 hover:ring-red-600 transition-all"
                >
                  <div className="aspect-[3/4]">
                    <img
                      src={listing.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop'}
                      alt={listing.display_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {listing.is_verified && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                        Verified
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-semibold text-sm">{listing.display_name}</h3>
                    <p className="text-gray-400 text-xs">{listing.city}, {listing.state}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Why Choose Us */}
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="bg-[#111] rounded-2xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Why Choose DommeDirectory?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-white font-semibold mb-2">Verified Profiles</h3>
                <p className="text-gray-400 text-sm">All providers are verified for your safety and peace of mind</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-white font-semibold mb-2">Nationwide Coverage</h3>
                <p className="text-gray-400 text-sm">Find providers in all major US cities and metropolitan areas</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-white font-semibold mb-2">Direct Connection</h3>
                <p className="text-gray-400 text-sm">Connect directly with providers. No middlemen or agencies</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-red-900/40 to-red-800/20 rounded-2xl p-8 text-center border border-red-800/30">
            <h2 className="text-2xl font-bold text-white mb-4">
              Are You a Professional Domme?
            </h2>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Join the largest directory of BDSM and fetish service providers in the USA. Get discovered by clients in your city.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Create Free Profile
              </Link>
              <Link
                href="/listings/create"
                className="bg-[#1a1a1a] hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-colors border border-gray-700"
              >
                Post a Listing
              </Link>
            </div>
          </div>
        </div>

        {/* SEO Content */}
        <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <article className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-4">
              Find Professional BDSM & Fetish Services in the USA
            </h2>
            <p className="text-gray-400 mb-4">
              DommeDirectory is the premier platform for connecting with professional dominatrixes, 
              mistresses, and BDSM service providers across the United States. Whether you&apos;re looking 
              for sessions in New York, Los Angeles, Chicago, or any major US city, our verified directory 
              makes it easy to find experienced providers who match your interests.
            </p>
            <p className="text-gray-400 mb-4">
              Browse our extensive listings featuring detailed profiles, service descriptions, rates, 
              and authentic photos. All providers are verified to ensure a safe, professional experience. 
              From bondage and discipline to roleplay and fetish services, find exactly what you&apos;re looking for.
            </p>
            <h3 className="text-xl font-semibold text-white mt-8 mb-4">
              Popular Services Available
            </h3>
            <ul className="grid grid-cols-2 gap-2 text-gray-400">
              <li>• Bondage & Discipline</li>
              <li>• Domination & Submission</li>
              <li>• Sadism & Masochism</li>
              <li>• Roleplay & Fantasy</li>
              <li>• Fetish Exploration</li>
              <li>• CBT & Impact Play</li>
              <li>• Foot Worship</li>
              <li>• Financial Domination</li>
            </ul>
          </article>
        </div>
      </div>
    </Layout>
  );
}
