import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { signUp } from '../../services/auth';
import { getAllLocations } from '../../services/locations';
import Layout from '../../components/layout/Layout'; // Assuming Layout component exists

const RegisterPage = () => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

    if (!selectedLocation) {
      setError('Please select a primary location.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await signUp(email, password, displayName, selectedLocation);

    if (signUpError) {
      setError(signUpError.message || 'Failed to sign up. Please check your details and try again.');
      console.error('Sign up error:', signUpError);
      setLoading(false);
    } else {
      // Sign up successful, redirect user to dashboard
      router.push('/dashboard');
      // No need to setLoading(false) here as we are navigating away
    }
  };

  return (
    <Layout> {/* Wrap content in Layout */}
      <div className="container mx-auto px-4 py-12 max-w-lg">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Create Your Account</h1>
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 space-y-6">
          <div>
            <label htmlFor="displayName" className="block text-gray-700 text-sm font-bold mb-2">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Your public display name"
            />
          </div>
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
              minLength="6" // Default Supabase minimum
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="******************"
            />
             <p className="text-xs text-gray-600">Minimum 6 characters.</p>
          </div>
          <div>
            <label htmlFor="location" className="block text-gray-700 text-sm font-bold mb-2">
              Primary Location
            </label>
            <select
              id="location"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              required
              className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${locations.length === 0 ? 'bg-gray-200' : 'bg-white'}`}
              disabled={loading || locations.length === 0}
            >
              <option value="" disabled>
                {loading ? 'Loading locations...' : (locations.length === 0 ? 'No locations available' : 'Select your primary location')}
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.city}, {loc.state}, {loc.country}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-500 text-xs italic">{error}</p>}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterPage;