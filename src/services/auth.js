import { supabase } from '../utils/supabase';
import { createClient } from '@supabase/supabase-js';

const getSupabaseServerConfig = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
};

export const getAuthTokenFromRequest = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  return token || null;
};

export const createAuthenticatedSupabaseClient = (token) => {
  const config = getSupabaseServerConfig();
  if (!config || !token) {
    return null;
  }

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

/**
 * Get user from request (for API routes)
 * @param {Object} req - Next.js request object
 */
export const getUserFromRequest = async (req) => {
  const config = getSupabaseServerConfig();
  if (!config) {
    console.error('Missing Supabase environment variables');
    return null;
  }

  const token = getAuthTokenFromRequest(req);
  if (!token) {
    return null;
  }

  const supabaseServer = createAuthenticatedSupabaseClient(token);
  if (!supabaseServer) {
    return null;
  }
  
  try {
    const { data: { user }, error } = await supabaseServer.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (err) {
    console.error('Error getting user from request:', err);
    return null;
  }
};

/**
 * Sign up a new domme
 * @param {string} email 
 * @param {string} password 
 * @param {string} displayName
 * @param {string} locationId
 * @param {boolean} marketingOptIn
 */
export const signUp = async (email, password, displayName, locationId, marketingOptIn = false) => {
  const normalizedMarketingOptIn = Boolean(marketingOptIn);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: 'domme',
          // Pass profile data to be used by the trigger
          display_name: displayName || email.split('@')[0],
          primary_location_id: locationId,
          marketing_opt_in: normalizedMarketingOptIn,
          marketing_opt_in_at: normalizedMarketingOptIn ? new Date().toISOString() : null,
        },
      },
    });

    if (error) throw error;

    // Profile creation is now handled by the database trigger 'on_auth_user_created'
    // No need to call createProfile from the client-side anymore.

    return { data, error: null };
  } catch (error) {
    console.error('Error signing up:', error.message);
    return { data: null, error };
  }
};

/**
 * Sign in existing user
 * @param {string} email 
 * @param {string} password 
 */
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error signing in:', error.message);
    return { data: null, error };
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error.message);
    return { error };
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    
    if (!data.session) {
      return { user: null, error: null };
    }
    
    return { user: data.session.user, error: null };
  } catch (error) {
    console.error('Error getting current user:', error.message);
    return { user: null, error };
  }
};

// The createProfile function is no longer needed here.
// Profile creation is handled by the database trigger 'on_auth_user_created'
// which uses the metadata passed during supabase.auth.signUp.
