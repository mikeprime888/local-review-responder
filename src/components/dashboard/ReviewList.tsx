'use client';

import { useState } from 'react';

interface Review {
  id: string;
  reviewerName: string | null;
  reviewerPhoto: string | null;
  starRating: number;
  comment: string | null;
  reviewReply: string | null;
  replyTime: string | null;
  googleCreatedAt: string;
  location: {
    title: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  onReply: (reviewId: string, comment: string) => Promise<boolean>;
  onDeleteReply: (reviewId: string) => Promise<boolean>;
}

export function ReviewList({ reviews, onReply, onDeleteReply }: ReviewListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      </div>

      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white rounded-xl shadow-sm border p-5"
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

            {/* Location badge */}
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {review.location.title}
            </span>
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

          {/* Reply Button / Form */}
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
                <button
                  onClick={() => setReplyingTo(review.id)}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Reply →
                </button>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
