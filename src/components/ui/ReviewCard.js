import { useState } from 'react';
import { Star, Trash2, Check } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/date';

export function ReviewCard({ review, showDelete = false, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    setIsDeleting(true);
    await onDelete?.(review.id);
    setIsDeleting(false);
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 border border-gray-800">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center">
            {review.reviewer?.profile_picture_url ? (
              <img
                src={review.reviewer.profile_picture_url}
                alt={review.reviewer.display_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-red-600 font-bold text-sm">
                {review.reviewer?.display_name?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div>
            <p className="text-white font-medium text-sm">
              {review.reviewer?.display_name || 'Anonymous'}
            </p>
            <p className="text-gray-500 text-xs">
              {formatDistanceToNow(new Date(review.created_at))}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= review.rating
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-600'
                }`}
              />
            ))}
          </div>
          
          {showDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="ml-2 p-1 text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <p className="text-gray-300 text-sm leading-relaxed">
        {review.content}
      </p>
      
      {review.is_verified && (
        <div className="mt-3 flex items-center gap-1 text-green-500 text-xs">
          <Check className="w-3 h-3" />
          <span>Verified Client</span>
        </div>
      )}
    </div>
  );
}

export function ReviewForm({ listingId, profileId, onSubmit, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (content.length < 10) {
      setError('Review must be at least 10 characters');
      return;
    }

    setSubmitting(true);
    
    const result = await onSubmit({ listingId, profileId, rating, content });
    
    if (result.error) {
      setError(result.error);
    } else {
      onClose?.();
    }
    
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-lg p-6 border border-gray-800">
      <h3 className="text-white font-semibold mb-4">Write a Review</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {/* Rating */}
      <div className="mb-4">
        <label className="block text-gray-400 text-sm mb-2">Your Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  star <= (hoverRating || rating)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-gray-600'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      
      {/* Review Text */}
      <div className="mb-4">
        <label className="block text-gray-400 text-sm mb-2">Your Review</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your experience..."
          rows={4}
          className="w-full bg-[#262626] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-600 resize-none"
        />
        <p className="text-gray-500 text-xs mt-1">
          {content.length}/1000 characters
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

export function StarRating({ rating, count, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= Math.round(rating)
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-gray-400 text-sm">
          {rating.toFixed(1)} ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}
