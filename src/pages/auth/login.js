import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { signIn } from '../../services/auth';
import Layout from '../../components/layout/Layout';
import { isValidEmail, sanitizeString } from '../../utils/validation'; // Assuming Layout component exists

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

    // Validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);

    const { data, error: signInError } = await signIn(
      sanitizeString(email, 255),
      password
    );

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
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">Login</h1>
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] shadow-xl rounded px-8 pt-6 pb-8 mb-4 space-y-6 border border-white/5">
          <div>
            <label htmlFor="email" className="block text-gray-300 text-sm font-bold mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="appearance-none border border-white/10 rounded w-full py-2 px-3 text-white bg-[#262626] leading-tight focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-300 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="appearance-none border border-white/10 rounded w-full py-2 px-3 text-white bg-[#262626] mb-3 leading-tight focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
              placeholder="******************"
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] w-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-900/20"
            >
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </div>
          <div className="text-center mt-4">
            <Link href="/auth/register" className="inline-block align-baseline font-bold text-sm text-red-500 hover:text-red-400">
              Don&apos;t have an account? Sign Up
            </Link>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default LoginPage;