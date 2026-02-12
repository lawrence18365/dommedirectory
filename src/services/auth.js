import { supabase } from '../utils/supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * Get user from request (for API routes)
 * @param {Object} req - Next.js request object
 */
export const getUserFromRequest = async (req) => {
  // Create a new Supabase client for server-side auth
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }

  const supabaseServer = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  
  // Get the JWT from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }
  
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
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
 */
export const signUp = async (email, password, displayName, locationId) => {
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
