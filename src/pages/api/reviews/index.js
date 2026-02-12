import { getUserFromRequest } from '../../../services/auth';
import { createReview, getListingReviews, getListingRating } from '../../../services/reviews';

/**
 * GET /api/reviews?listingId=xxx
 * POST /api/reviews
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { listingId, limit, offset, sortBy } = req.query;

    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID required' });
    }

    try {
      const [{ reviews }, { average, count }] = await Promise.all([
        getListingReviews(listingId, { limit: parseInt(limit) || 10, offset: parseInt(offset) || 0, sortBy }),
        getListingRating(listingId)
      ]);

      return res.status(200).json({ reviews, average, count });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  if (req.method === 'POST') {
    // Authenticate user
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { listing_id, profile_id, rating, content } = req.body;

    // Validation
    if (!listing_id || !profile_id || !rating || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (content.length < 10) {
      return res.status(400).json({ error: 'Review must be at least 10 characters' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Review must be less than 1000 characters' });
    }

    try {
      const { review, error } = await createReview({
        listing_id,
        profile_id,
        reviewer_id: user.id,
        rating,
        content
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(201).json({ review });
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ error: 'Failed to create review' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
