import { supabase } from '../utils/supabase';
import { uploadProfilePicture } from './storage';

/**
 * Get profile by ID
 * @param {string} profileId 
 */
export const getProfile = async (profileId) => {
  try {
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
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: profileData.display_name,
        bio: profileData.bio,
        primary_location_id: profileData.primary_location_id,
        secondary_locations: profileData.secondary_locations || [],
        contact_email: profileData.contact_email,
        contact_phone: profileData.contact_phone,
        website: profileData.website,
        social_links: profileData.social_links || {},
        services_offered: profileData.services_offered || {},
        updated_at: new Date(),
      })
      .eq('id', profileId);

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
    const { url, error } = await uploadProfilePicture(profileId, file);
    if (error) throw error;

    // Update profile with new picture URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_picture_url: url })
      .eq('id', profileId);

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
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const { error } = await supabase
      .from('profiles')
      .update({
        is_verified: true,
        verification_expires_at: expiryDate.toISOString(),
        updated_at: new Date(),
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

/**
 * Submit verification documents
 * @param {string} profileId 
 * @param {Array} documentUrls - Array of file URLs from storage
 */
export const submitVerification = async (profileId, documentUrls) => {
  try {
    const { error } = await supabase
      .from('verifications')
      .insert([
        {
          profile_id: profileId,
          document_urls: documentUrls,
          status: 'pending',
          created_at: new Date(),
          updated_at: new Date(),
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
