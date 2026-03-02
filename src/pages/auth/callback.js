import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';
import { getOnboardingStatus, touchProfileLastActive } from '../../services/profiles';
import { validatePassword } from '../../utils/validation';
import Layout from '../../components/layout/Layout';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // loading, recovery, success, error
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const redirectAfterAuth = useCallback(async (session, successMessage = 'Authentication successful!') => {
    let nextPath = '/dashboard';

    if (session?.user?.id) {
      await touchProfileLastActive(session.user.id);
      const onboarding = await getOnboardingStatus(session.user.id);
      if (!onboarding.isComplete) {
        nextPath = '/onboarding';
      }
    }

    setStatus('success');
    setMessage(successMessage);
    setTimeout(() => {
      router.push(nextPath);
    }, 2000);
  }, [router]);

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setRecoveryError('');

    if (!newPassword || !confirmPassword) {
      setRecoveryError('Please fill in both password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryError('Passwords do not match.');
      return;
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setRecoveryError(passwordValidation.errors.join('. '));
      return;
    }

    setSavingPassword(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        throw updateError;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        await redirectAfterAuth(session, 'Password updated successfully.');
      } else {
        setStatus('success');
        setMessage('Password updated successfully. Please log in with your new password.');
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Password reset completion error:', error);
      setRecoveryError(error.message || 'Failed to update password. Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

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
        const code = hashParams.get('code') || queryParams.get('code');
        const type = hashParams.get('type') || queryParams.get('type');
        const isRecovery = type === 'recovery';
        const isSignup = type === 'signup';
        let session = null;
        let usedExistingSession = false;

        if (accessToken && refreshToken) {
          // Set the session with the tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            throw sessionError;
          }
          session = data.session;
        } else if (code) {
          // PKCE/email-link flows can return an auth code instead of raw tokens
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
          session = data.session;
        } else {
          // No tokens found - check if we already have a session
          const {
            data: { session: existingSession },
          } = await supabase.auth.getSession();
          session = existingSession;
          usedExistingSession = true;
        }

        if (!session) {
          throw new Error('No authentication tokens found');
        }

        if (isRecovery) {
          setStatus('recovery');
          setMessage('Set a new password to finish resetting your account.');
          return;
        }

        if (session.access_token) {
          fetch('/api/referrals/attribute', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }).catch(() => {});
        }

        await redirectAfterAuth(
          session,
          usedExistingSession
            ? 'You are already logged in.'
            : (isSignup ? 'Email confirmed! Your account is now active.' : 'Authentication successful!')
        );
      } catch (err) {
        console.error('Auth callback error:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to complete authentication');
      }
    };

    handleAuthCallback();
  }, [router.isReady, router.query, redirectAfterAuth]);

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

          {status === 'recovery' && (
            <>
              <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <form onSubmit={handlePasswordReset} className="space-y-4 text-left">
                <div>
                  <label htmlFor="new-password" className="block text-gray-300 text-sm font-medium mb-2">
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-gray-300 text-sm font-medium mb-2">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                    autoComplete="new-password"
                    required
                  />
                </div>

                {recoveryError && (
                  <div className="bg-red-900/20 border border-red-500/50 rounded p-3">
                    <p className="text-red-200 text-sm">{recoveryError}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Use at least 8 characters with uppercase, lowercase, number, and a special character (e.g. !@#$%&*-_).
                </p>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition-colors"
                >
                  {savingPassword ? 'Saving...' : 'Save New Password'}
                </button>
              </form>
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
