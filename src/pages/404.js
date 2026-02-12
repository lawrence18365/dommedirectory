import Link from 'next/link';
import Head from 'next/head';
import Layout from '../components/layout/Layout';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | DommeDirectory</title>
        <meta name="description" content="The page you're looking for could not be found." />
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-6xl font-extrabold text-gray-900">404</h1>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h2>
          <p className="mt-2 text-base text-gray-600">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or deleted.
          </p>
          <div className="mt-8 space-y-4">
            <Link
              href="/"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Go Home
            </Link>
            <Link
              href="/cities"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Browse Cities
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

// Use layout for consistent navigation
Custom404.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};
