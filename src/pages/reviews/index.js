import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getCurrentUser } from '../../services/auth';
import { getUserReviews, getProviderReviews } from '../../services/reviews';
import { ReviewCard } from '../../components/ui/ReviewCard';
import { Star, Loader2, MessageSquare } from 'lucide-react';

export default function Reviews() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'given'
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      fetchReviews();
    }
  }, [user, activeTab]);

  const checkAuth = async () => {
    const { user: currentUser } = await getCurrentUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);
    setLoading(false);
  };

  const fetchReviews = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      if (activeTab === 'received') {
        const { reviews: data, error } = await getProviderReviews(user.id);
        if (!error && data) {
          setReviews(data);
          // Calculate average
          if (data.length > 0) {
            const sum = data.reduce((acc, r) => acc + r.rating, 0);
            setAverageRating(Math.round((sum / data.length) * 10) / 10);
            setTotalReviews(data.length);
          }
        }
      } else {
        const { reviews: data, error } = await getUserReviews(user.id);
        if (!error && data) {
          setReviews(data);
          setTotalReviews(data.length);
          setAverageRating(0);
        }
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    // Implement delete functionality
    setReviews(reviews.filter(r => r.id !== reviewId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="p-6 bg-[#0a0a0a] min-h-[calc(100vh-3.5rem)]">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Reviews</h1>
              <p className="text-gray-400">Manage your reviews and ratings</p>
            </div>
            
            {activeTab === 'received' && totalReviews > 0 && (
              <div className="flex items-center gap-4 bg-[#1a1a1a] px-4 py-2 rounded-lg border border-gray-800">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(averageRating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">{averageRating.toFixed(1)}</p>
                  <p className="text-gray-500 text-xs">{totalReviews} reviews</p>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('received')}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'received'
                  ? 'text-red-500 border-red-500'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              Reviews Received
            </button>
            <button
              onClick={() => setActiveTab('given')}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'given'
                  ? 'text-red-500 border-red-500'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              Reviews Given
            </button>
          </div>

          {/* Reviews List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 bg-[#1a1a1a] rounded-lg border border-gray-800">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white font-semibold mb-2">
                {activeTab === 'received' 
                  ? 'No Reviews Yet'
                  : 'You haven\'t written any reviews'}
              </h3>
              <p className="text-gray-400 text-sm max-w-md mx-auto">
                {activeTab === 'received'
                  ? 'Reviews from clients will appear here once they leave feedback about their experience with you.'
                  : 'After booking sessions, you can leave reviews to help others find great providers.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  showDelete={activeTab === 'given'}
                  onDelete={handleDeleteReview}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
