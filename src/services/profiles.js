import { supabase } from '../utils/supabase';

/**
 * Get profile by ID
 * @param {string} profileId 
 */
export const getProfile = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`*, locations!primary_location_id(id, city, state, country)`) // Restore the join
      .eq('id', profileId)
      .limit(1); // Fetch at most one row

    if (error) {
      // Don't throw if the error is just that no rows were found
      if (error.code === 'PGRST116') {
        return { profile: null, error: null }; // No profile found is not an error here
      }
      throw error; // Rethrow other errors
    }
    return { profile: data.length > 0 ? data[0] : null, error: null }; // Return the first profile or null
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
 * Submit verification documents
 * @param {string} profileId 
 * @param {Array} documentUrls - Array of file paths in storage
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

    if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
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
 * Upload profile picture
 * @param {string} profileId 
 * @param {File} file 
 */
export const uploadProfilePicture = async (profileId, file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `profile_picture.${fileExt}`;
    const filePath = `${profileId}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('listing_images')
      .upload(filePath, file, {
        upsert: true
      });
      
    if (uploadError) throw uploadError;
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('listing_images')
      .getPublicUrl(filePath);
      
    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error uploading profile picture:', error.message);
    return { url: null, error };
  }
};
