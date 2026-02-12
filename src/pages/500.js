import Link from 'next/link';
import Head from 'next/head';
import Layout from '../components/layout/Layout';

export default function Custom500() {
  return (
    <Layout>
      <Head>
        <title>Server Error | DommeDirectory</title>
        <meta name="description" content="An unexpected error occurred on the server." />
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-6xl font-extrabold text-gray-900">500</h1>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Server error</h2>
          <p className="mt-2 text-base text-gray-600">
            We&apos;re sorry, but something went wrong on our end. Please try again later.
          </p>
          <div className="mt-8 space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Refresh Page
            </button>
            <Link
              href="/"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
