import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

const ProfileContext = createContext({
  profile: null,
  loading: true,
  error: null,
  refetchProfile: () => {},
});

export const ProfileProvider = ({ children }) => {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    // console.log('ProfileContext: Fetching profile for user:', user.id);
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*') // Select all profile fields needed globally
        .eq('id', user.id)
        .single();

      if (fetchError) {
        // console.error('ProfileContext: Error fetching profile:', fetchError);
        throw fetchError;
      }
      
      // console.log('ProfileContext: Profile data fetched:', data);
      setProfile(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch profile');
      setProfile(null); // Clear profile on error
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]); // fetchProfile depends on user and supabase

  const contextValue = {
    profile,
    loading,
    error,
    refetchProfile: fetchProfile, // Provide the fetch function for manual refetching
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);