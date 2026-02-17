import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useProfile } from '../../context/ProfileContext';

export default function Header() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navigation = [
    { name: 'Home', href: '/', current: router.pathname === '/' },
    { name: 'Search', href: '/cities', current: router.pathname === '/cities' || router.pathname.startsWith('/location/') },
    { name: 'Reviews', href: '/reviews', current: router.pathname === '/reviews' },
    { name: 'Videos', href: '/videos', current: router.pathname === '/videos' },
  ];

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Create Listing', href: '/listings/create' },
    { name: 'Settings', href: '/settings' },
  ];

  return (
    <Disclosure as="nav" className="bg-[#0a0a0a] border-b border-gray-800">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" className="flex-shrink-0 flex items-center">
                  <span className="text-white font-black text-xl tracking-tight">
                    DOMME<span className="text-red-600">DIR</span>
                  </span>
                </Link>
                
                {/* Desktop Navigation */}
                <div className="hidden md:ml-8 md:flex md:space-x-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        item.current 
                          ? 'text-white bg-gray-800' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Side - Auth */}
              <div className="hidden md:flex md:items-center md:space-x-4">
                {user ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                        <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold">
                          {profileLoading ? '...' : profile?.display_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm font-medium">
                          {profile?.display_name || user?.email?.split('@')[0]}
                        </span>
                      </Menu.Button>
                    </div>
                    <Transition
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-[#1a1a1a] py-1 shadow-lg ring-1 ring-black ring-opacity-5 border border-gray-700 focus:outline-none">
                        {userNavigation.map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <Link
                                href={item.href}
                                className={`block px-4 py-2 text-sm text-gray-300 ${
                                  active ? 'bg-gray-800 text-white' : ''
                                }`}
                              >
                                {item.name}
                              </Link>
                            )}
                          </Menu.Item>
                        ))}
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleSignOut}
                              className={`block w-full text-left px-4 py-2 text-sm text-red-400 ${
                                active ? 'bg-gray-800' : ''
                              }`}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="text-gray-300 hover:text-white px-3 py-2 text-sm font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth/register"
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="flex items-center md:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white focus:outline-none">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <Disclosure.Panel className="md:hidden bg-[#111]">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={`block rounded-md px-3 py-2 text-base font-medium ${
                    item.current
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
            <div className="border-t border-gray-800 pb-3 pt-4">
              {user ? (
                <>
                  <div className="flex items-center px-5">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                        {profileLoading ? '...' : profile?.display_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-white">
                        {profileLoading ? 'Loading...' : profile?.display_name}
                      </div>
                      <div className="text-sm font-medium text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1 px-2">
                    {userNavigation.map((item) => (
                      <Disclosure.Button
                        key={item.name}
                        as={Link}
                        href={item.href}
                        className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        {item.name}
                      </Disclosure.Button>
                    ))}
                    <Disclosure.Button
                      as="button"
                      onClick={handleSignOut}
                      className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-red-400 hover:bg-gray-800"
                    >
                      Sign out
                    </Disclosure.Button>
                  </div>
                </>
              ) : (
                <div className="mt-3 space-y-1 px-2">
                  <Disclosure.Button
                    as={Link}
                    href="/auth/login"
                    className="block rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    Login
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/auth/register"
                    className="block rounded-md px-3 py-2 text-base font-medium bg-red-600 text-white hover:bg-red-700"
                  >
                    Sign Up
                  </Disclosure.Button>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
