'use client';

import { useState, useEffect } from 'react';
import AIResponseGenerator from '@/components/AIResponseGenerator';

interface Review {
  id: string;
  reviewerName: string | null;
  reviewerPhoto: string | null;
  starRating: number;
  comment: string | null;
  reviewReply: string | null;
  replyTime: string | null;
  googleCreatedAt: string;
  isPublished: boolean;
  publishedAt: string | null;
  location: {
    title: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  onReply: (reviewId: string, comment: string) => Promise<boolean>;
  onDeleteReply: (reviewId: string) => Promise<boolean>;
}

export function ReviewList({ reviews: propReviews, onReply, onDeleteReply }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>(propReviews);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Keep local state in sync with parent props
  useEffect(() => {
    setReviews(propReviews);
  }, [propReviews]);

  async function handleSubmitReply(reviewId: string) {
    if (!replyText.trim()) return;
    setSubmitting(true);
    const success = await onReply(reviewId, replyText);
    if (success) {
      setReplyingTo(null);
      setReplyText('');
    }
    setSubmitting(false);
  }

  function handleAISelect(reviewId: string, response: string) {
    setReplyingTo(reviewId);
    setReplyText(response);
  }

  async function togglePublish(reviewId: string) {
    setTogglingId(reviewId);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/publish`, {
        method: 'PATCH',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, isPublished: data.isPublished, publishedAt: data.publishedAt }
            : r
        )
      );
    } catch (err) {
      console.error('Error toggling publish:', err);
    } finally {
      setTogglingId(null);
    }
  }

  function renderStars(rating: number) {
    return (
      <span className="inline-flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}
          >
            ★
          </span>
        ))}
      </span>
    );
  }

  function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }

  const publishedCount = reviews.filter((r) => r.isPublished).length;

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
        <div className="text-4xl mb-3">📝</div>
        <h3 className="font-semibold text-gray-900">No Reviews Yet</h3>
        <p className="text-sm text-gray-500 mt-1">
          Sync your locations to pull in reviews from Google.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">
          Reviews ({reviews.length})
        </h2>
        <div className="text-sm text-gray-600">
          <span className="font-medium text-green-600">{publishedCount}</span> of{' '}
          <span className="font-medium">{reviews.length}</span> published to widget
        </div>
      </div>

      {reviews.map((review) => (
        <div
          key={review.id}
          className={`bg-white rounded-xl shadow-sm border p-5 ${
            review.isPublished ? 'border-green-200' : 'border-gray-200'
          }`}
        >
          {/* Review Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {review.reviewerPhoto ? (
                <img
                  src={review.reviewerPhoto}
                  alt=""
                  className="w-10 h-10 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                  {(review.reviewerName || '?')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">
                  {review.reviewerName || 'Anonymous'}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {renderStars(review.starRating)}
                  <span className="text-xs text-gray-400">
                    {timeAgo(review.googleCreatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Location badge + Publish toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {review.location.title}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${review.isPublished ? 'text-green-600' : 'text-gray-400'}`}>
                  {review.isPublished ? 'Published' : 'Unpublished'}
                </span>
                <button
                  onClick={() => togglePublish(review.id)}
                  disabled={togglingId === review.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    togglingId === review.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'
                  } ${review.isPublished ? 'bg-green-500' : 'bg-gray-300'}`}
                  role="switch"
                  aria-checked={review.isPublished}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      review.isPublished ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Review Comment */}
          {review.comment && (
            <p className="mt-3 text-gray-700 text-sm leading-relaxed">
              {review.comment}
            </p>
          )}

          {/* Existing Reply */}
          {review.reviewReply && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-blue-700">
                  Your Reply
                  {review.replyTime && (
                    <span className="text-blue-400 ml-2">
                      {timeAgo(review.replyTime)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onDeleteReply(review.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
              <p className="mt-1 text-sm text-blue-900">{review.reviewReply}</p>
            </div>
          )}

          {/* Reply Button / Form / AI Generator */}
          {!review.reviewReply && (
            <>
              {replyingTo === review.id ? (
                <div className="mt-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSubmitReply(review.id)}
                      disabled={submitting || !replyText.trim()}
                      className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {submitting ? 'Posting...' : 'Post Reply'}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => setReplyingTo(review.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Write Your Own Reply →
                  </button>
                </div>
              )}

              {/* AI Response Generator */}
              <AIResponseGenerator
                review={{
                  id: review.id,
                  reviewerName: review.reviewerName,
                  rating: review.starRating,
                  comment: review.comment,
                }}
                businessName={review.location?.title || 'Your Business'}
                onSelectResponse={(response) => handleAISelect(review.id, response)}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
