import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard, { StatsGrid } from '../../components/ui/StatCard';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { MiniStat } from '../../components/ui/StatCard';
import { Eye, MessageSquare, Check, Star, BarChart3, Edit3, DollarSign, Calendar, TrendingUp, Loader2, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { getCurrentUser } from '../../services/auth';
import { getListingsByProfile, deleteListing } from '../../services/listings';
import { getOnboardingStatus } from '../../services/profiles';
import { supabase } from '../../utils/supabase';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    listings: 0,
    views: 0,
    messages: 0,
    bookings: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setLoading(true);
    const { user: currentUser, error } = await getCurrentUser();
    
    if (error || !currentUser) {
      router.push('/auth/login');
      return;
    }

    const onboarding = await getOnboardingStatus(currentUser.id);
    if (!onboarding.isComplete) {
      router.replace('/onboarding');
      return;
    }

    setUser(currentUser);
    await fetchProfile(currentUser.id);
    await fetchDashboardData(currentUser.id);
    setLoading(false);
  };

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchDashboardData = async (userId) => {
    // Fetch user's listings count
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', userId);

    setStats({
      listings: listingsCount || 0,
      views: 0,
      messages: 0,
      bookings: 0,
    });

    // Fetch actual listings
    setListingsLoading(true);
    const { listings: userListings, error } = await getListingsByProfile(userId);
    if (!error && userListings) {
      setListings(userListings);
    }
    setListingsLoading(false);

    setRecentActivity([]);
    setUpcomingBookings([]);
  };

  const handleDeleteListing = async (listingId) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    
    const { error } = await deleteListing(listingId);
    if (!error) {
      setListings(listings.filter(l => l.id !== listingId));
      setStats(prev => ({ ...prev, listings: prev.listings - 1 }));
    } else {
      alert('Failed to delete listing');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const profileCompletion = calculateProfileCompletion(profile);

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="p-6 space-y-6 bg-[#0a0a0a] min-h-[calc(100vh-3.5rem)]">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {displayName}</h1>
            <p className="text-gray-400">Here&apos;s what&apos;s happening with your profile</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" leftIcon={<BarChart3 className="w-4 h-4" />}>
              View Analytics
            </Button>
            <Button leftIcon={<Edit3 className="w-4 h-4" />} onClick={() => router.push('/profile')}>
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Main Stats */}
        <StatsGrid>
          <StatCard
            title="Active Listings"
            value={stats.listings}
            change={0}
            changeType="neutral"
            icon={<Calendar className="w-6 h-6 text-red-600" />}
          />
          <StatCard
            title="Profile Views"
            value={stats.views}
            change={0}
            changeType="neutral"
            icon={<Eye className="w-6 h-6 text-red-600" />}
          />
          <StatCard
            title="Messages"
            value={stats.messages}
            change={0}
            changeType="neutral"
            icon={<MessageSquare className="w-6 h-6 text-red-600" />}
          />
          <StatCard
            title="Bookings"
            value={stats.bookings}
            change={0}
            changeType="neutral"
            icon={<Check className="w-6 h-6 text-red-600" />}
          />
        </StatsGrid>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Getting Started / Empty State */}
          <Card className="lg:col-span-2">
            <CardHeader
              title={stats.listings === 0 ? "Getting Started" : "Performance Overview"}
              description={stats.listings === 0 
                ? "Complete these steps to get the most out of your profile" 
                : "Your profile activity over time"}
            />
            <CardContent>
              {stats.listings === 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                      <span className="text-red-600 font-bold">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Complete Your Profile</p>
                      <p className="text-gray-400 text-sm">Add your bio, photos, and services</p>
                    </div>
                    <Button size="sm" onClick={() => router.push('/profile')}>Complete</Button>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
                      <span className="text-red-600 font-bold">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Create Your First Listing</p>
                      <p className="text-gray-400 text-sm">Set up your services and rates</p>
                    </div>
                    <Button size="sm" onClick={() => router.push('/listings/create')}>Create</Button>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-[#1a1a1a] rounded-lg opacity-50">
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                      <span className="text-gray-400 font-bold">3</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Get Verified</p>
                      <p className="text-gray-400 text-sm">Build trust with potential clients</p>
                    </div>
                    <Button size="sm" variant="secondary" disabled>Verify</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Listings Summary */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.listings}</p>
                      <p className="text-gray-400 text-sm">Active Listings</p>
                    </div>
                    <Button 
                      size="sm" 
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={() => router.push('/listings/create')}
                    >
                      New Listing
                    </Button>
                  </div>
                  
                  {/* Listings List */}
                  {listingsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 text-red-600 animate-spin" />
                    </div>
                  ) : listings.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 bg-[#1a1a1a] rounded-lg">
                      <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p>No listings yet</p>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="mt-3"
                        onClick={() => router.push('/listings/create')}
                      >
                        Create Your First Listing
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {listings.map((listing) => (
                        <div 
                          key={listing.id} 
                          className="flex items-center gap-3 p-3 bg-[#1a1a1a] rounded-lg group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                              {listing.title}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {listing.locations?.city}, {listing.locations?.state}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => router.push(`/listings/${listing.id}`)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                              title="View"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/listings/edit/${listing.id}`)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteListing(listing.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Status */}
          <Card>
            <CardHeader
              title="Profile Status"
              description="Your current profile completion"
            />
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{profileCompletion}%</div>
                <p className="text-gray-400 text-sm">Complete</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  {profile?.display_name ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600" />
                  )}
                  <span className={profile?.display_name ? 'text-white' : 'text-gray-400'}>Display Name</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {profile?.bio ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600" />
                  )}
                  <span className={profile?.bio ? 'text-white' : 'text-gray-400'}>Bio</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {profile?.profile_picture_url ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600" />
                  )}
                  <span className={profile?.profile_picture_url ? 'text-white' : 'text-gray-400'}>Profile Photo</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  {stats.listings > 0 ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-gray-600" />
                  )}
                  <span className={stats.listings > 0 ? 'text-white' : 'text-gray-400'}>Active Listing</span>
                </div>
              </div>

              {profileCompletion < 100 && (
                <Button fullWidth size="sm" onClick={() => router.push('/profile')}>
                  Complete Profile
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Bookings */}
          <Card>
            <CardHeader
              title="Upcoming Bookings"
              description="Your scheduled sessions"
              action={
                <Button variant="ghost" size="sm">View All</Button>
              }
            />
            <CardContent>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No upcoming bookings</p>
                  <p className="text-sm">Bookings will appear here when clients schedule with you</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center text-red-600 font-semibold">
                          {booking.client[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{booking.client}</p>
                          <p className="text-gray-400 text-xs">{booking.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm">{booking.date}</p>
                        <Badge
                          variant={booking.status === 'confirmed' ? 'success' : 'warning'}
                          size="sm"
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader
              title="Recent Activity"
              description="Latest interactions with your profile"
            />
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No recent activity</p>
                  <p className="text-sm">Activity will appear here when people view your profile</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <activity.icon className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-white text-sm">
                            {activity.type === 'view' && `Profile viewed by ${activity.user}`}
                            {activity.type === 'message' && `New message from ${activity.user}`}
                            {activity.type === 'booking' && `Booking confirmed: ${activity.user}`}
                            {activity.type === 'review' && `New review from ${activity.user}`}
                          </p>
                          <p className="text-gray-400 text-xs">{activity.time}</p>
                        </div>
                      </div>
                      {activity.value && (
                        <span className="text-red-600 font-medium text-sm">
                          {activity.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile Completion CTA */}
        {profileCompletion < 100 && (
          <Card>
            <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Complete Your Profile</h3>
                  <p className="text-gray-400 text-sm">Add more details to increase visibility</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 w-48 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div className="h-full bg-red-600 rounded-full" style={{ width: `${profileCompletion}%` }} />
                    </div>
                    <span className="text-red-600 text-sm font-medium">{profileCompletion}%</span>
                  </div>
                </div>
              </div>
              <Button onClick={() => router.push('/profile')}>Complete Profile</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function calculateProfileCompletion(profile) {
  if (!profile) return 0;
  
  let score = 0;
  let total = 4;
  
  if (profile.display_name) score++;
  if (profile.bio) score++;
  if (profile.profile_picture_url) score++;
  if (profile.primary_location_id) score++;
  
  return Math.round((score / total) * 100);
}
