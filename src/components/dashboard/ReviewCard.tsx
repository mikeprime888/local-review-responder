'use client';

import { useState } from 'react';

interface Review {
  id: string;
  reviewerName: string | null;
  reviewerPhoto: string | null;
  starRating: number;
  comment: string | null;
  reviewReply: string | null;
  googleCreatedAt: string;
  isPublished: boolean;
  publishedAt: string | null;
  isFeatured: boolean;
}

interface ReviewCardProps {
  review: Review;
  onUpdate?: (reviewId: string, updates: Partial<Review>) => void;
  showPublishControls?: boolean;
}

export default function ReviewCard({ review, onUpdate, showPublishControls = true }: ReviewCardProps) {
  const [isPublished, setIsPublished] = useState(review.isPublished);
  const [isFeatured, setIsFeatured] = useState(review.isFeatured);
  const [loading, setLoading] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handlePublishToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      });

      if (res.ok) {
        const newPublished = !isPublished;
        setIsPublished(newPublished);
        if (!newPublished) setIsFeatured(false);
        onUpdate?.(review.id, { isPublished: newPublished, isFeatured: !newPublished ? false : isFeatured });
      }
    } catch (err) {
      console.error('Failed to toggle publish:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeatureToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${review.id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !isFeatured }),
      });

      if (res.ok) {
        const newFeatured = !isFeatured;
        setIsFeatured(newFeatured);
        if (newFeatured && !isPublished) setIsPublished(true);
        onUpdate?.(review.id, { isFeatured: newFeatured, isPublished: newFeatured ? true : isPublished });
      }
    } catch (err) {
      console.error('Failed to toggle feature:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`bg-white rounded-lg border p-4 transition-all ${
        isFeatured ? 'border-yellow-400 ring-2 ring-yellow-100' : 'border-gray-200'
      } ${isPublished ? '' : 'opacity-60'}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {review.reviewerPhoto ? (
            <img
              src={review.reviewerPhoto}
              alt={review.reviewerName || 'Reviewer'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
              {getInitials(review.reviewerName)}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{review.reviewerName || 'Anonymous'}</p>
            <p className="text-sm text-gray-500">{formatDate(review.googleCreatedAt)}</p>
          </div>
        </div>
        {renderStars(review.starRating)}
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-gray-700 mb-3 line-clamp-4">{review.comment}</p>
      )}

      {/* Reply */}
      {review.reviewReply && (
        <div className="bg-gray-50 rounded-lg p-3 mb-3 border-l-4 border-blue-500">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Your Response</p>
          <p className="text-sm text-gray-700 line-clamp-2">{review.reviewReply}</p>
        </div>
      )}

      {/* Publish Controls */}
      {showPublishControls && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Publish Toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={handlePublishToggle}
                  disabled={loading}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
              <span className="text-sm text-gray-600">
                {isPublished ? 'Published' : 'Unpublished'}
              </span>
            </label>

            {/* Feature Button */}
            {isPublished && (
              <button
                onClick={handleFeatureToggle}
                disabled={loading}
                className={`flex items-center gap-1 px-2 py-1 rounded text-sm transition-colors ${
                  isFeatured
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {isFeatured ? 'Featured' : 'Feature'}
              </button>
            )}
          </div>

          {/* Status indicator */}
          {isPublished && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Visible on widget
            </span>
          )}
        </div>
      )}
    </div>
  );
}
