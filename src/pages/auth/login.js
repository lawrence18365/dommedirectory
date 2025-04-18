import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link'; // Import Link for navigation
import { signIn } from '../../services/auth';
import Layout from '../../components/layout/Layout'; // Assuming Layout component exists

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setLoading(true);

    const { data, error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message || 'Failed to sign in. Please check your credentials.');
      console.error('Sign in error:', signInError);
      setLoading(false);
    } else {
      // Sign in successful, redirect user (e.g., to dashboard or intended page)
      // Check if there's a 'redirect' query param or default to dashboard
      const redirectPath = router.query.redirect || '/dashboard';
      router.push(redirectPath);
      // No need to setLoading(false) here as we are navigating away
    }
  };

  return (
    <Layout> {/* Wrap content in Layout */}
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Login</h1>
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="******************"
            />
          </div>

          {error && <p className="text-red-500 text-xs italic">{error}</p>}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </div>
          <div className="text-center mt-4">
             <Link href="/auth/register" className="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800">
                Don't have an account? Sign Up
             </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default LoginPage;