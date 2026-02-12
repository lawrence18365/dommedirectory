import { supabase } from '../utils/supabase';
import { uploadListingMedia as uploadToStorage } from './storage';

/**
 * Create a new listing
 * @param {string} profileId - ID of the profile creating the listing
 * @param {Object} listingData - Listing data
 */
export const createListing = async (profileId, listingData) => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .insert([
        {
          profile_id: profileId,
          location_id: listingData.locationId,
          title: listingData.title,
          description: listingData.description,
          services: listingData.services || {},
          rates: listingData.rates || {},
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        }
      ])
      .select();

    if (error) throw error;
    return { listing: data[0], error: null };
  } catch (error) {
    console.error('Error creating listing:', error.message);
    return { listing: null, error };
  }
};

/**
 * Get listing by ID
 * @param {string} listingId 
 */
export const getListingById = async (listingId) => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles!inner(*),
        locations!inner(*),
        media(*)
      `)
      .eq('id', listingId)
      .single();

    if (error) throw error;
    return { listing: data, error: null };
  } catch (error) {
    console.error('Error fetching listing:', error.message);
    return { listing: null, error };
  }
};

/**
 * Update a listing
 * @param {string} listingId 
 * @param {Object} listingData 
 */
export const updateListing = async (listingId, listingData) => {
  try {
    const { error } = await supabase
      .from('listings')
      .update({
        location_id: listingData.locationId,
        title: listingData.title,
        description: listingData.description,
        services: listingData.services || {},
        rates: listingData.rates || {},
        updated_at: new Date(),
      })
      .eq('id', listingId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error updating listing:', error.message);
    return { error };
  }
};

/**
 * Delete a listing
 * @param {string} listingId 
 */
export const deleteListing = async (listingId) => {
  try {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting listing:', error.message);
    return { error };
  }
};

/**
 * Get all listings for a profile
 * @param {string} profileId 
 */
export const getListingsByProfile = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        locations(id, city, state, country)
      `)
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { listings: data, error: null };
  } catch (error) {
    console.error('Error fetching profile listings:', error.message);
    return { listings: null, error };
  }
};

/**
 * Upload media for a listing
 * @param {string} listingId 
 * @param {File} file 
 * @param {boolean} isPrimary - Whether this is the primary image
 */
export const uploadListingMedia = async (listingId, file, isPrimary = false) => {
  return uploadMedia(listingId, file, isPrimary);
};

export const uploadMedia = async (listingId, file, isPrimary = false) => {
  try {
    // Upload to Cloudflare or Supabase
    const { url, error: uploadError } = await uploadToStorage(listingId, file);
    if (uploadError) throw uploadError;

    // Get the current profile_id for this listing
    const { data: listingData, error: listingError } = await supabase
      .from('listings')
      .select('profile_id')
      .eq('id', listingId)
      .single();

    if (listingError) throw listingError;

    // Create media record
    const { data: mediaData, error: mediaError } = await supabase
      .from('media')
      .insert([
        {
          listing_id: listingId,
          storage_path: url,
          media_type: file.type.startsWith('image/') ? 'image' : 'video',
          is_primary: isPrimary
        }
      ])
      .select();

    if (mediaError) throw mediaError;

    // If this is primary, update any existing primary to not be primary
    if (isPrimary) {
      await supabase
        .from('media')
        .update({ is_primary: false })
        .eq('listing_id', listingId)
        .neq('id', mediaData[0].id);
    }

    return { media: mediaData[0], error: null };
  } catch (error) {
    console.error('Error uploading media:', error.message);
    return { media: null, error };
  }
};

/**
 * Delete media
 * @param {string} mediaId 
 */
export const deleteMedia = async (mediaId) => {
  try {
    // Get media record
    const { data: mediaData, error: fetchError } = await supabase
      .from('media')
      .select('*')
      .eq('id', mediaId)
      .single();
      
    if (fetchError) throw fetchError;
    
    // Delete from database
    const { error: deleteRecordError } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaId);
      
    if (deleteRecordError) throw deleteRecordError;
    
    // Delete file from storage
    try {
      const { getFilePathFromUrl } = await import('./storage');
      const filePath = getFilePathFromUrl(mediaData.storage_path);
      if (filePath) {
        await supabase.storage.from('media').remove([filePath]);
      }
    } catch (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }
    
    return { error: null };
  } catch (error) {
    console.error('Error deleting media:', error.message);
    return { error };
  }
};

/**
 * Set primary media
 * @param {string} listingId 
 * @param {string} mediaId 
 */
export const setPrimaryMedia = async (listingId, mediaId) => {
  try {
    // Unset all primary for this listing
    await supabase
      .from('media')
      .update({ is_primary: false })
      .eq('listing_id', listingId);

    // Set new primary
    const { error } = await supabase
      .from('media')
      .update({ is_primary: true })
      .eq('id', mediaId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error setting primary media:', error.message);
    return { error };
  }
};
