import { supabase } from '../utils/supabase';

/**
 * Get reviews for a listing
 * @param {string} listingId 
 * @param {Object} options - { limit, offset, sortBy }
 */
export const getListingReviews = async (listingId, options = {}) => {
  const { limit = 10, offset = 0, sortBy = 'newest' } = options;
  
  try {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(display_name, profile_picture_url)
      `)
      .eq('listing_id', listingId)
      .eq('is_approved', true)
      .range(offset, offset + limit - 1);

    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'highest') {
      query = query.order('rating', { ascending: false });
    } else if (sortBy === 'lowest') {
      query = query.order('rating', { ascending: true });
    }

    const { data, error } = await query;

    if (error) throw error;
    return { reviews: data || [], error: null };
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    return { reviews: [], error };
  }
};

/**
 * Get average rating for a listing
 * @param {string} listingId 
 */
export const getListingRating = async (listingId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('listing_id', listingId)
      .eq('is_approved', true);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { average: 0, count: 0, error: null };
    }

    const sum = data.reduce((acc, review) => acc + review.rating, 0);
    const average = Math.round((sum / data.length) * 10) / 10;

    return { average, count: data.length, error: null };
  } catch (error) {
    console.error('Error fetching rating:', error.message);
    return { average: 0, count: 0, error };
  }
};

/**
 * Create a new review
 * @param {Object} reviewData 
 */
export const createReview = async (reviewData) => {
  try {
    const listingId = reviewData.listing_id || reviewData.listingId;
    const profileId = reviewData.profile_id || reviewData.profileId;
    const content = reviewData.content;
    const rating = Number(reviewData.rating);

    let reviewerId = reviewData.reviewer_id || reviewData.reviewerId;
    if (!reviewerId) {
      const { data: { user } } = await supabase.auth.getUser();
      reviewerId = user?.id || null;
    }

    if (!listingId || !profileId || !reviewerId || !content) {
      return { review: null, error: new Error('Missing required review fields') };
    }

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return { review: null, error: new Error('Rating must be between 1 and 5') };
    }

    // Check if user has already reviewed this listing
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('listing_id', listingId)
      .eq('reviewer_id', reviewerId)
      .single();

    if (existingReview) {
      return { review: null, error: new Error('You have already reviewed this listing') };
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert([{
        listing_id: listingId,
        profile_id: profileId,
        reviewer_id: reviewerId,
        rating,
        content,
        is_approved: true, // Auto-approve for now
        created_at: new Date(),
      }])
      .select()
      .single();

    if (error) throw error;
    return { review: data, error: null };
  } catch (error) {
    console.error('Error creating review:', error.message);
    return { review: null, error };
  }
};

/**
 * Get reviews written by a user
 * @param {string} userId 
 */
export const getUserReviews = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        listing:listings!listing_id(title, id),
        provider:profiles!profile_id(display_name)
      `)
      .eq('reviewer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { reviews: data || [], error: null };
  } catch (error) {
    console.error('Error fetching user reviews:', error.message);
    return { reviews: [], error };
  }
};

/**
 * Get reviews received by a provider
 * @param {string} profileId 
 */
export const getProviderReviews = async (profileId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviewer_id(display_name, profile_picture_url),
        listing:listings!listing_id(title)
      `)
      .eq('profile_id', profileId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { reviews: data || [], error: null };
  } catch (error) {
    console.error('Error fetching provider reviews:', error.message);
    return { reviews: [], error };
  }
};

/**
 * Delete a review
 * @param {string} reviewId 
 * @param {string} userId 
 */
export const deleteReview = async (reviewId, userId) => {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('reviewer_id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error deleting review:', error.message);
    return { error };
  }
};
