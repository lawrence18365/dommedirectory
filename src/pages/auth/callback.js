import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { getOnboardingStatus, touchProfileLastActive } from '../../services/profiles';
import Layout from '../../components/layout/Layout';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!router.isReady) return;

    const handleAuthCallback = async () => {
      try {
        if (!isSupabaseConfigured) {
          setStatus('error');
          setMessage('Authentication is unavailable until Supabase is configured.');
          return;
        }

        // Check for error parameters first
        const error = router.query.error;
        const errorDescription = router.query.error_description;

        if (error) {
          setStatus('error');
          setMessage(errorDescription || 'Authentication failed');
          return;
        }

        // Get the access_token and refresh_token from URL hash or query
        // Supabase can send tokens either in hash fragment or query params
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const queryParams = new URLSearchParams(window.location.search);

        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const type = hashParams.get('type') || queryParams.get('type');

        if (accessToken) {
          // Set the session with the tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }

          if (data.session) {
            const userId = data.session.user?.id;
            const accessToken = data.session.access_token;
            if (accessToken) {
              fetch('/api/referrals/attribute', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }).catch(() => {});
            }

            let nextPath = '/dashboard';
            if (userId) {
              touchProfileLastActive(userId);
              const onboarding = await getOnboardingStatus(userId);
              if (!onboarding.isComplete) {
                nextPath = '/onboarding';
              }
            }

            setStatus('success');
            setMessage(type === 'signup' 
              ? 'Email confirmed! Your account is now active.' 
              : 'Authentication successful!');
            
            // Redirect after a short delay
            setTimeout(() => {
              router.push(nextPath);
            }, 2000);
          } else {
            throw new Error('No session established');
          }
        } else {
          // No tokens found - check if we already have a session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            if (session.access_token) {
              fetch('/api/referrals/attribute', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              }).catch(() => {});
            }

            touchProfileLastActive(session.user.id);
            const onboarding = await getOnboardingStatus(session.user.id);
            const nextPath = onboarding.isComplete ? '/dashboard' : '/onboarding';
            setStatus('success');
            setMessage('You are already logged in.');
            setTimeout(() => {
              router.push(nextPath);
            }, 1500);
          } else {
            throw new Error('No authentication tokens found');
          }
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to complete authentication');
      }
    };

    handleAuthCallback();
  }, [router.isReady, router.query]);

  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Completing Authentication...</h1>
              <p className="text-gray-400">Please wait while we verify your email.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Success!</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <p className="text-sm text-gray-500">Redirecting...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Authentication Failed</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.push('/auth/login')}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => router.push('/auth/register')}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
