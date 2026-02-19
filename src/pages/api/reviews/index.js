import { getUserFromRequest } from '../../../services/auth';
import { createReview, getListingReviews, getListingRating } from '../../../services/reviews';
import { sanitizeString } from '../../../utils/validation';
import { applyRateLimit } from '../../../utils/rateLimit';

/**
 * GET /api/reviews?listingId={listingId}
 * POST /api/reviews
 */
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { listingId, limit, offset, sortBy } = req.query;

    if (!listingId) {
      return res.status(400).json({ error: 'Listing ID required' });
    }

    const allowedSortBy = ['newest', 'highest', 'lowest'];
    const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'newest';

    try {
      const [{ reviews }, { average, count }] = await Promise.all([
        getListingReviews(listingId, { limit: parseInt(limit) || 10, offset: parseInt(offset) || 0, sortBy: safeSortBy }),
        getListingRating(listingId)
      ]);

      return res.status(200).json({ reviews, average, count });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  if (req.method === 'POST') {
    if (!applyRateLimit(req, res, { maxRequests: 20 })) return;

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
        content: sanitizeString(content, 1000)
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
