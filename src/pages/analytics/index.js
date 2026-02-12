import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getCurrentUser } from '../../services/auth';
import { BarChart3, Loader2 } from 'lucide-react';

export default function Analytics() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { user: currentUser } = await getCurrentUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);
    setLoading(false);
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
        <h1 className="text-2xl font-bold text-white mb-6">Analytics</h1>
        
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Coming Soon</h2>
          <p className="text-gray-400">
            Profile views, engagement metrics, and revenue analytics are being implemented.
            <br />
            Check back soon!
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
