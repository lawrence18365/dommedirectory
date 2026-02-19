import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signUp } from '../../services/auth';
import { getAllLocations } from '../../services/locations';
import { clearReferralAttribution, getReferralSignupMetadata } from '../../services/referrals';
import Layout from '../../components/layout/Layout';
import { isValidEmail, validatePassword, sanitizeString } from '../../utils/validation';
import { MARKETING_CONSENT_TEXT } from '../../utils/constants';

const RegisterPage = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Fetch locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      setError(null); // Clear previous errors
      const { locations: fetchedLocations, error: fetchError } = await getAllLocations();
      if (fetchError) {
        setError('Failed to load locations. Please refresh the page or try again later.');
        console.error('Location fetch error:', fetchError);
      } else {
        setLocations(fetchedLocations || []);
      }
      setLoading(false);
    };
    fetchLocations();
  }, []);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Validation
    if (!displayName.trim()) {
      setError('Display name is required.');
      return;
    }

    if (displayName.trim().length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join('. '));
      return;
    }

    if (!selectedLocation) {
      setError('Please select a primary location.');
      return;
    }

    setLoading(true);
    const referralMetadata = getReferralSignupMetadata();
    const { data, error: signUpError } = await signUp(
      sanitizeString(email, 255),
      password,
      sanitizeString(displayName, 100),
      selectedLocation,
      marketingOptIn,
      referralMetadata
    );

    if (signUpError) {
      setError(signUpError.message || 'Failed to sign up. Please check your details and try again.');
      console.error('Sign up error:', signUpError);
      setLoading(false);
    } else if (data?.user && !data?.session) {
      // Email confirmation required
      clearReferralAttribution();
      setSuccess(true);
      setLoading(false);
    } else {
      // Auto-confirmed (no email required) - redirect to onboarding
      clearReferralAttribution();
      router.push('/onboarding');
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <h1 className="text-4xl font-bold mb-8 text-center text-white">Create Your Account</h1>
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] shadow-xl rounded px-8 pt-6 pb-8 mb-4 space-y-6 border border-white/5">
          <div>
            <label htmlFor="displayName" className="block text-gray-300 text-sm font-bold mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="appearance-none border border-white/10 rounded w-full py-2 px-3 text-white bg-[#262626] leading-tight focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
              placeholder="Your public display name"
            />
          </div>
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
              minLength="6"
              className="appearance-none border border-white/10 rounded w-full py-2 px-3 text-white bg-[#262626] mb-3 leading-tight focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 placeholder-gray-500"
              placeholder="******************"
            />
            <p className="text-xs text-gray-400">Minimum 8 characters with uppercase, lowercase, number, and special character.</p>
          </div>
          <div>
            <label htmlFor="location" className="block text-gray-300 text-sm font-bold mb-2">
              Primary Location
            </label>
            <select
              id="location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              required
              className={`appearance-none border border-white/10 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 ${locations.length === 0 ? 'bg-[#262626]/50 cursor-not-allowed' : 'bg-[#262626]'}`}
              disabled={loading || success || locations.length === 0}
            >
              <option value="" disabled className="text-gray-500">
                {loading ? 'Loading locations...' : (locations.length === 0 ? 'No locations available' : 'Select your primary location')}
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="text-white bg-[#262626]">
                  {loc.city}, {loc.state}, {loc.country}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-start gap-3 rounded border border-white/10 bg-[#151515] px-3 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-[#262626] text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-300">
              {MARKETING_CONSENT_TEXT}
            </span>
          </label>

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-900/20 border border-green-500/50 rounded p-4 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-green-400 font-semibold mb-1">Account Created!</h3>
              <p className="text-green-200/80 text-sm mb-3">
                Check your email <strong>{email}</strong> to confirm your account.
              </p>
              <p className="text-gray-400 text-xs">
                After confirming, <Link href="/auth/login" className="text-green-400 hover:underline">log in here</Link> and you&apos;ll continue onboarding.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading || success}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a] w-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-red-900/20"
            >
              {loading ? 'Creating Account...' : (success ? 'Account Created' : 'Sign Up')}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterPage;
