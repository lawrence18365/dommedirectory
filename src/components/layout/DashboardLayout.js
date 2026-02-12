import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { LayoutDashboard, User, MessageSquare, Calendar, Star, BarChart3, Check, Settings, LogOut } from 'lucide-react';
import { signOut } from '../../services/auth';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Messages', href: '/messages', icon: MessageSquare, badge: 0 },
  { name: 'Bookings', href: '/bookings', icon: Calendar },
  { name: 'Reviews', href: '/reviews', icon: Star },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Verification', href: '/verification', icon: Check },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children, user, profile }) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const isVerified = profile?.is_verified || false;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#0d0d0d] border-b border-gray-800">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo & Mobile Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/" className="flex items-center gap-2">
                <span className="text-white font-black text-xl tracking-tight">
                  DOMME<span className="text-red-600">DIR</span>
                </span>
              </Link>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center text-white text-sm font-bold">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-white text-sm font-medium">{displayName}</p>
                    <Badge variant={isVerified ? "success" : "secondary"} size="sm">
                      {isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#1a1a1a] rounded-lg border border-gray-700 shadow-xl z-50">
                    <div className="p-4 border-b border-gray-700">
                      <p className="text-white font-medium">{displayName}</p>
                      <p className="text-gray-500 text-sm truncate">{email}</p>
                    </div>
                    <div className="p-2">
                      <Link href="/profile" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg text-sm">
                        View Profile
                      </Link>
                      <Link href="/settings" className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg text-sm">
                        Settings
                      </Link>
                      <button 
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-800 rounded-lg text-sm flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed lg:sticky top-14 left-0 z-30
          w-64 h-[calc(100vh-3.5rem)]
          bg-[#0d0d0d] border-r border-gray-800
          transform transition-transform duration-300
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${router.pathname === item.href || router.pathname.startsWith(item.href + '/')
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Upgrade Card */}
          {!isVerified && (
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl p-4">
                <p className="text-white font-semibold text-sm mb-1">Get Verified</p>
                <p className="text-gray-400 text-xs mb-3">Build trust with verified badge</p>
                <Button size="sm" fullWidth onClick={() => router.push('/verification')}>
                  Verify Now
                </Button>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
