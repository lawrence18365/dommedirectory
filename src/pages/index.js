import { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/layout/Layout';
import SEO, { generateWebsiteSchema, generateOrganizationSchema } from '../components/ui/SEO';
import { Search, MapPin, Video, Star, Heart } from 'lucide-react';
import { supabase } from '../utils/supabase';

// Static city data for sidebar (deterministic, no random)
const popularCities = [
  { name: 'Toronto', count: 245, country: 'Canada' },
  { name: 'New York', count: 189, country: 'USA' },
  { name: 'Vancouver', count: 156, country: 'Canada' },
  { name: 'Los Angeles', count: 134, country: 'USA' },
  { name: 'Montreal', count: 98, country: 'Canada' },
  { name: 'Chicago', count: 87, country: 'USA' },
  { name: 'Miami', count: 76, country: 'USA' },
];

// Mock data for featured dommes (will be replaced with real data)
const mockFeaturedDommes = [
  { id: 1, display_name: 'MistressV', city: 'Toronto', country: 'Canada', is_online: true, profile_picture_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop', is_verified: true },
  { id: 2, display_name: 'GoddessAlex', city: 'Vancouver', country: 'Canada', is_online: true, profile_picture_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop', is_verified: true },
  { id: 3, display_name: 'DommeLuna', city: 'Montreal', country: 'Canada', is_online: false, profile_picture_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop', is_verified: false },
  { id: 4, display_name: 'QueenRaven', city: 'New York', country: 'USA', is_online: true, profile_picture_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=500&fit=crop', is_verified: true },
  { id: 5, display_name: 'LadyScarlet', city: 'Los Angeles', country: 'USA', is_online: false, profile_picture_url: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop', is_verified: true },
  { id: 6, display_name: 'MistressIvy', city: 'Chicago', country: 'USA', is_online: true, profile_picture_url: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=500&fit=crop', is_verified: false },
  { id: 7, display_name: 'GoddessMaya', city: 'Miami', country: 'USA', is_online: true, profile_picture_url: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop', is_verified: true },
  { id: 8, display_name: 'DominaZara', city: 'Seattle', country: 'USA', is_online: false, profile_picture_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop', is_verified: true },
  { id: 9, display_name: 'EmpressJade', city: 'Toronto', country: 'Canada', is_online: true, profile_picture_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop', is_verified: true },
  { id: 10, display_name: 'LadyViper', city: 'Vancouver', country: 'Canada', is_online: false, profile_picture_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=500&fit=crop', is_verified: false },
  { id: 11, display_name: 'MistressOnyx', city: 'Montreal', country: 'Canada', is_online: true, profile_picture_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', is_verified: true },
  { id: 12, display_name: 'GoddessSage', city: 'New York', country: 'USA', is_online: true, profile_picture_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop', is_verified: true },
];

// Domme of the Day
const dommeOfTheDay = {
  id: 99,
  display_name: 'MistressSeraphina',
  age: 28,
  city: 'Dubai',
  country: 'UAE',
  profile_picture_url: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=600&h=800&fit=crop',
  tagline: 'Elite Dominatrix & Fetish Specialist',
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dommes, setDommes] = useState(mockFeaturedDommes);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by rendering random elements only after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch listings from Supabase (not just profiles)
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        // Get active listings with profile and location data
        const { data, error } = await supabase
          .from('listings')
          .select(`
            id,
            title,
            description,
            is_active,
            profiles!inner(id, display_name, profile_picture_url, is_verified),
            locations!inner(city, country),
            media(storage_path, is_primary)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(12);

        if (error) throw error;

        if (data && data.length > 0) {
          // Transform data to match our format
          // Note: is_online is set to false initially to avoid hydration mismatch
          // It will be randomized on client after mount
          const transformed = data.map((listing, index) => {
            // Get primary image or first image
            const primaryMedia = listing.media?.find(m => m.is_primary) || listing.media?.[0];
            const imageUrl = primaryMedia?.storage_path || listing.profiles?.profile_picture_url;
            
            return {
              id: listing.id,
              display_name: listing.profiles?.display_name || 'Anonymous',
              city: listing.locations?.city || 'Unknown',
              country: listing.locations?.country || '',
              is_online: false, // Will be set after mount
              profile_picture_url: imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
              is_verified: listing.profiles?.is_verified,
              title: listing.title,
            };
          });
          setDommes(transformed);
          
          // Randomize online status after mount (client-side only)
          setTimeout(() => {
            setDommes(prev => prev.map(d => ({
              ...d,
              is_online: Math.random() > 0.6
            })));
          }, 100);
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
        // Keep using mock data if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    // Redirect to search page with query
    window.location.href = `/cities?q=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <Layout>
      <SEO 
        title="Find Professional Dommes in USA & Canada"
        description="Browse verified professional dommes and mistresses in major US cities. Find BDSM, fetish, and domination services near you. New York, Los Angeles, Chicago, Miami & more."
        canonical="https://dommedirectory.com"
        jsonLd={[generateWebsiteSchema(), generateOrganizationSchema()]}
      />

      <h1 className="sr-only">Find Professional Dommes in Major US Cities</h1>
      
      {/* Dark Background */}
      <div className="min-h-screen bg-[#0a0a0a]">
        
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
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-[#1a1a1a] rounded-lg overflow-hidden animate-pulse">
                      <div className="aspect-[3/4] bg-gray-800" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-800 rounded w-3/4" />
                        <div className="h-3 bg-gray-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {dommes.map((domme) => (
                    <Link
                      key={domme.id}
                      href={`/listings/${domme.id}`}
                      className="group relative bg-[#1a1a1a] rounded-lg overflow-hidden hover:ring-2 hover:ring-red-600 transition-all"
                    >
                      {/* Image */}
                      <div className="aspect-[3/4] relative">
                        <img
                          src={domme.profile_picture_url}
                          alt={domme.display_name}
                          className="w-full h-full object-cover"
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {/* Online Indicator - Only show after client mount to avoid hydration mismatch */}
                        {mounted && domme.is_online && (
                          <div className="absolute top-2 left-2 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
                        )}
                        
                        {/* Verified Badge */}
                        {domme.is_verified && (
                          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded">
                            Verified
                          </div>
                        )}
                        
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
              
              {/* Domme of the Day */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-gray-800" />
                  <span className="text-red-600 font-bold text-sm uppercase tracking-wider">
                    Domme of the Day
                  </span>
                </div>
                
                <Link 
                  href={`/listings/${dommeOfTheDay.id}`}
                  className="block relative rounded-lg overflow-hidden group"
                >
                  <div className="aspect-[3/4]">
                    <img
                      src={dommeOfTheDay.profile_picture_url}
                      alt={dommeOfTheDay.display_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  </div>
                  
                  {/* Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded uppercase">
                      Featured
                    </span>
                  </div>
                  
                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-bold text-lg">
                      {dommeOfTheDay.display_name} • {dommeOfTheDay.age} y/o
                    </h3>
                    <p className="text-gray-300 text-sm">
                      {dommeOfTheDay.city}, {dommeOfTheDay.country}
                    </p>
                    <p className="text-gray-400 text-xs mt-1 italic">
                      {dommeOfTheDay.tagline}
                    </p>
                  </div>
                </Link>
              </div>

              {/* Quick Links */}
              <div className="bg-[#111] rounded-lg p-4 border border-gray-800">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Video className="w-4 h-4 text-red-600" />
                  Video of the Day
                </h3>
                <div className="aspect-video bg-gray-800 rounded flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-red-600 border-b-8 border-b-transparent ml-1" />
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div className="bg-[#111] rounded-lg p-4 border border-gray-800">
                <h3 className="text-white font-semibold mb-4">Browse by City</h3>
                <div className="space-y-2">
                  {popularCities.slice(0, 7).map((city) => (
                    <Link
                      key={city.name}
                      href={`/cities?q=${city.name}`}
                      className="flex items-center justify-between text-gray-400 hover:text-white py-2 px-3 rounded hover:bg-gray-800 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {city.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        {city.count}
                      </span>
                    </Link>
                  ))}
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

        {/* Features Section */}
        <div className="border-t border-gray-800 mt-12">
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
