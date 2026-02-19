import { supabase, isSupabaseConfigured } from '../utils/supabase';

// Backblaze B2 Configuration
const B2_PUBLIC_URL = process.env.NEXT_PUBLIC_B2_PUBLIC_URL;

const USE_B2 = !!B2_PUBLIC_URL;

/**
 * Get current session token for API authentication
 */
const getAuthToken = async () => {
  try {
    if (!isSupabaseConfigured) {
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
};

/**
 * Upload image to Backblaze B2 via API route
 * NSFW content allowed (legal adult content only)
 * 
 * @param {File} file - The file to upload
 * @param {string} bucket - Storage bucket name (legacy, not used with B2)
 * @param {string} path - File path within bucket (legacy, not used with B2)
 * @param {string} type - 'profile' | 'listing' | 'verification'
 * @returns {Promise<{url: string|null, error: Error|null}>}
 */
export const uploadImage = async (file, bucket = 'media', path = '', type = 'profile') => {
  // Try B2 first if configured
  if (USE_B2) {
    return uploadToB2(file, type);
  }
  
  // Fallback to Supabase Storage
  return uploadToSupabase(file, bucket, path);
};

/**
 * Upload to Backblaze B2 via API route
 */
const uploadToB2 = async (file, type) => {
  try {
    // Get auth token
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await fetch('/api/media/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }

    return { url: data.url, error: null };
  } catch (error) {
    console.error('B2 upload error:', error.message);
    return { url: null, error };
  }
};

/**
 * Upload to Supabase Storage (fallback)
 */
const uploadToSupabase = async (file, bucket, path) => {
  try {
    if (!isSupabaseConfigured) {
      return { url: null, error: new Error('Supabase is not configured') };
    }

    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Supabase upload error:', error.message);
    return { url: null, error };
  }
};

/**
 * Delete image from storage
 */
export const deleteImage = async (url, bucket = 'media') => {
  // B2 URL - extract key and delete via API
  if (B2_PUBLIC_URL && url.includes(B2_PUBLIC_URL)) {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const key = url.replace(B2_PUBLIC_URL + '/', '');
      const response = await fetch('/api/media/delete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ key }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Delete failed');
      }
      
      return { error: null };
    } catch (error) {
      console.error('B2 delete error:', error.message);
      return { error };
    }
  }

  // Supabase delete
  try {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase is not configured') };
    }

    const filePath = getFilePathFromUrl(url, bucket);
    if (filePath) {
      const { error } = await supabase.storage.from(bucket).remove([filePath]);
      if (error) throw error;
    }
    return { error: null };
  } catch (error) {
    console.error('Delete error:', error.message);
    return { error };
  }
};

/**
 * Extract file path from public URL
 */
export const getFilePathFromUrl = (url, bucket = 'media') => {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (pathMatch && pathMatch[1] === bucket) {
      return pathMatch[2];
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (userId, file) => {
  return uploadImage(file, 'media', `profiles/${userId}`, 'profile');
};

/**
 * Upload listing media
 */
export const uploadListingMedia = async (listingId, file) => {
  return uploadImage(file, 'media', `listings/${listingId}`, 'listing');
};

/**
 * Upload verification document
 */
export const uploadVerificationDocument = async (userId, file) => {
  return uploadImage(file, 'media', `verifications/${userId}`, 'verification');
};
