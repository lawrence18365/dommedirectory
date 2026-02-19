import { supabase, isSupabaseConfigured } from '../utils/supabase';
import { uploadProfilePicture } from './storage';

const MIN_PROFILE_BIO_LENGTH = 80;
const MIN_LISTING_TITLE_LENGTH = 10;
const MIN_LISTING_DESCRIPTION_LENGTH = 120;

const getSupabaseConfigError = () =>
  new Error('Supabase is not configured');

/**
 * Get profile by ID
 * @param {string} profileId 
 */
export const getProfile = async (profileId) => {
  try {
    if (!isSupabaseConfigured) {
      return { profile: null, error: getSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`*, locations!primary_location_id(id, city, state, country)`)
      .eq('id', profileId)
      .limit(1);

    if (error) {
      if (error.code === 'PGRST116') {
        return { profile: null, error: null };
      }
      throw error;
    }
    return { profile: data.length > 0 ? data[0] : null, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    return { profile: null, error };
  }
};

/**
 * Update user profile
 * @param {string} profileId 
 * @param {Object} profileData 
 */
export const updateProfile = async (profileId, profileData) => {
  try {
    if (!isSupabaseConfigured) {
      return { error: getSupabaseConfigError() };
    }

    const updatePayload = {
      id: profileId,
      updated_at: new Date().toISOString(),
    };

    if (Object.prototype.hasOwnProperty.call(profileData, 'display_name')) {
      updatePayload.display_name = profileData.display_name;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'bio')) {
      updatePayload.bio = profileData.bio;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'primary_location_id')) {
      updatePayload.primary_location_id = profileData.primary_location_id;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'secondary_locations')) {
      updatePayload.secondary_locations = profileData.secondary_locations || [];
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'contact_email')) {
      updatePayload.contact_email = profileData.contact_email;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'contact_phone')) {
      updatePayload.contact_phone = profileData.contact_phone;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'website')) {
      updatePayload.website = profileData.website;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'social_links')) {
      updatePayload.social_links = profileData.social_links || {};
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'services_offered')) {
      updatePayload.services_offered = profileData.services_offered || {};
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'profile_picture_url')) {
      updatePayload.profile_picture_url = profileData.profile_picture_url;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'marketing_opt_in')) {
      updatePayload.marketing_opt_in = Boolean(profileData.marketing_opt_in);
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'marketing_opt_in_at')) {
      updatePayload.marketing_opt_in_at = profileData.marketing_opt_in_at || null;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'response_time_hours')) {
      updatePayload.response_time_hours = profileData.response_time_hours || null;
    }

    if (Object.prototype.hasOwnProperty.call(profileData, 'last_active_at')) {
      updatePayload.last_active_at = profileData.last_active_at || null;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert(updatePayload, { onConflict: 'id' });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating profile:', error.message);
    return { error };
  }
};

/**
 * Update profile picture
 * @param {string} profileId 
 * @param {File} file 
 */
export const updateProfilePicture = async (profileId, file) => {
  try {
    if (!isSupabaseConfigured) {
      return { url: null, error: getSupabaseConfigError() };
    }

    const { url, error } = await uploadProfilePicture(profileId, file);
    if (error) throw error;

    // Update profile with new picture URL
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: profileId,
          profile_picture_url: url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (updateError) throw updateError;
    return { url, error: null };
  } catch (error) {
    console.error('Error updating profile picture:', error.message);
    return { url: null, error };
  }
};

/**
 * Mark profile as verified after successful payment
 * @param {string} profileId
 */
export const markProfileAsVerified = async (profileId) => {
  try {
    if (!isSupabaseConfigured) {
      return { error: getSupabaseConfigError() };
    }

    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const { error } = await supabase
      .from('profiles')
      .update({
        is_verified: true,
        verification_tier: 'basic',
        verification_expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (error) throw error;
    console.log(`Profile ${profileId} marked as verified until ${expiryDate.toISOString()}`);
    return { error: null };
  } catch (error) {
    console.error(`Error marking profile ${profileId} as verified:`, error.message);
    return { error };
  }
};

export const touchProfileLastActive = async (profileId) => {
  try {
    if (!isSupabaseConfigured) {
      return { error: getSupabaseConfigError() };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        last_active_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating last active timestamp:', error.message);
    return { error };
  }
};

/**
 * Submit verification documents
 * @param {string} profileId 
 * @param {Array} documentUrls - Array of file URLs from storage
 * @param {'basic' | 'pro'} tierRequested - Requested verification tier
 */
export const submitVerification = async (profileId, documentUrls, tierRequested = 'basic') => {
  try {
    if (!isSupabaseConfigured) {
      return { error: getSupabaseConfigError() };
    }

    const { error } = await supabase
      .from('verifications')
      .insert([
        {
          profile_id: profileId,
          document_urls: documentUrls,
          tier_requested: ['basic', 'pro'].includes(tierRequested) ? tierRequested : 'basic',
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error submitting verification:', error.message);
    return { error };
  }
};

/**
 * Check verification status
 * @param {string} profileId 
 */
export const checkVerificationStatus = async (profileId) => {
  try {
    if (!isSupabaseConfigured) {
      return { verification: null, status: 'not_submitted', error: getSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('verifications')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return { 
      verification: data || null,
      status: data?.status || 'not_submitted', 
      error: null 
    };
  } catch (error) {
    console.error('Error checking verification status:', error.message);
    return { verification: null, status: null, error };
  }
};

/**
 * Upload verification document
 * @param {string} profileId 
 * @param {File} file 
 */
export const uploadVerificationDocument = async (profileId, file) => {
  const { uploadVerificationDocument: uploadDoc } = await import('./storage');
  return uploadDoc(profileId, file);
};

/**
 * Determine whether a user has completed onboarding.
 * Criteria:
 * - Profile exists
 * - Display name present
 * - Primary location selected
 * - Bio has enough unique detail
 * - At least one detailed listing created
 */
export const getOnboardingStatus = async (profileId) => {
  try {
    if (!isSupabaseConfigured) {
      return {
        isComplete: false,
        hasDisplayName: false,
        hasPrimaryLocation: false,
        hasBio: false,
        hasListing: false,
        hasDetailedListing: false,
        listingsCount: 0,
        error: getSupabaseConfigError(),
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, primary_location_id, bio')
      .eq('id', profileId)
      .maybeSingle();

    if (profileError) throw profileError;

    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, description')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (listingsError) throw listingsError;

    const listingsCount = listings?.length || 0;
    const hasDisplayName = Boolean(profile?.display_name?.trim());
    const hasPrimaryLocation = Boolean(profile?.primary_location_id);
    const hasBio =
      Boolean(profile?.bio?.trim()) && profile.bio.trim().length >= MIN_PROFILE_BIO_LENGTH;
    const hasListing = listingsCount > 0;
    const hasDetailedListing = (listings || []).some((listing) => {
      const title = listing?.title?.trim() || '';
      const description = listing?.description?.trim() || '';
      return (
        title.length >= MIN_LISTING_TITLE_LENGTH &&
        description.length >= MIN_LISTING_DESCRIPTION_LENGTH
      );
    });

    return {
      isComplete: hasDisplayName && hasPrimaryLocation && hasBio && hasDetailedListing,
      hasDisplayName,
      hasPrimaryLocation,
      hasBio,
      hasListing,
      hasDetailedListing,
      listingsCount,
      error: null,
    };
  } catch (error) {
    console.error('Error checking onboarding status:', error.message);
    return {
      isComplete: false,
      hasDisplayName: false,
      hasPrimaryLocation: false,
      hasBio: false,
      hasListing: false,
      hasDetailedListing: false,
      listingsCount: 0,
      error,
    };
  }
};
