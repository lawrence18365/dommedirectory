import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="flex flex-wrap justify-center -mx-5 -my-2">
          <div className="px-5 py-2">
            <Link href="/" className="text-base text-gray-300 hover:text-white">
              Home
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/cities" className="text-base text-gray-300 hover:text-white">
              Cities
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/auth/register" className="text-base text-gray-300 hover:text-white">
              Sign Up
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/privacy" className="text-base text-gray-300 hover:text-white">
              Privacy Policy
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/terms" className="text-base text-gray-300 hover:text-white">
              Terms of Service
            </Link>
          </div>
        </nav>
        <p className="mt-8 text-center text-base text-gray-400">
          &copy; {new Date().getFullYear()} DommeDirectory. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
