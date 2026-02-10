'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
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

function ReviewsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const locationId = searchParams.get('locationId') || '';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const url = locationId
        ? `/api/google/reviews?locationId=${locationId}`
        : '/api/google/reviews';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [session, locationId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const togglePublish = async (reviewId: string) => {
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
    } catch (err: any) {
      console.error('Error toggling publish:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: replyText }),
      });
      if (res.ok) {
        setReplyingId(null);
        setReplyText('');
        await fetchReviews();
      }
    } catch {
      console.error('Failed to submit reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchReviews();
      }
    } catch {
      console.error('Failed to delete reply');
    }
  };

  const handleAISelect = (reviewId: string, response: string) => {
    setReplyingId(reviewId);
    setReplyText(response);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const publishedCount = reviews.filter((r) => r.isPublished).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 mt-1">View and manage all your Google reviews</p>
        </div>
        {reviews.length > 0 && (
          <div className="text-sm text-gray-600">
            <span className="font-medium text-green-600">{publishedCount}</span> of{' '}
            <span className="font-medium">{reviews.length}</span> published to widget
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No reviews found. Sync your locations to pull in reviews.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-lg border p-4 ${
                review.isPublished ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-500 text-sm">{renderStars(review.starRating)}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {review.reviewerName || 'Anonymous'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(review.googleCreatedAt).toLocaleDateString()}
                    </span>
                    {review.location?.title && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                        {review.location.title}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800">{review.comment || 'No comment'}</p>

                  {/* Reply section */}
                  {review.reviewReply && (
                    <div className="mt-2 pl-3 border-l-2 border-blue-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">Reply:</span>{' '}
                        {review.reviewReply}
                      </p>
                      <button
                        onClick={() => handleDeleteReply(review.id)}
                        className="text-xs text-red-500 hover:text-red-700 mt-1"
                      >
                        Delete reply
                      </button>
                    </div>
                  )}

                  {/* Reply input */}
                  {replyingId === review.id ? (
                    <div className="mt-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={submittingReply || !replyText.trim()}
                          className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submittingReply ? 'Sending...' : 'Send Reply'}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingId(null);
                            setReplyText('');
                          }}
                          className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    !review.reviewReply && (
                      <button
                        onClick={() => setReplyingId(review.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                      >
                        Reply
                      </button>
                    )
                  )}

                  {/* AI Response Generator — shows for reviews without a reply */}
                  {!review.reviewReply && (
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
                  )}
                </div>

                {/* Toggle switch */}
                <div className="ml-4 flex-shrink-0 flex items-center gap-2">
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
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ReviewsContent />
    </Suspense>
  );
}
