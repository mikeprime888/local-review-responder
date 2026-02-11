'use client';

import { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AIResponseGenerator from '@/components/AIResponseGenerator';

interface Location {
  id: string;
  title: string;
}

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

interface Stats {
  totalReviews: number;
  averageRating: number;
  unreplied: number;
  ratingBreakdown: Record<number, number>;
}

const REVIEWS_PER_PAGE = 25;

function ReviewsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const urlLocationId = searchParams.get('locationId') || (typeof window !== 'undefined' ? localStorage.getItem('selectedLocationId') || '' : '');

  // Data
  const [locations, setLocations] = useState<Location[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedLocationId, setSelectedLocationId] = useState<string>(urlLocationId);
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [replyFilter, setReplyFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);

  // Reply state
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Publish toggle state
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch locations for filter dropdown
  useEffect(() => {
    if (!session) return;
    fetch('/api/subscriptions?active=true')
      .then((res) => res.json())
      .then((data) => {
        setLocations(
          (data.locations || []).map((l: any) => ({ id: l.id, title: l.title }))
        );
      })
      .catch(console.error);
  }, [session]);

  // Fetch reviews when filters change
  const fetchReviews = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLocationId) params.set('locationId', selectedLocationId);
      if (ratingFilter) params.set('rating', ratingFilter);
      if (replyFilter === 'needs_reply') params.set('replied', 'false');
      if (replyFilter === 'replied') params.set('replied', 'true');

      const res = await fetch(`/api/google/reviews?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [session, selectedLocationId, ratingFilter, replyFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(REVIEWS_PER_PAGE);
  }, [selectedLocationId, ratingFilter, replyFilter, searchQuery]);

  // Client-side search filter
  const filteredReviews = useMemo(() => {
    if (!searchQuery.trim()) return reviews;
    const q = searchQuery.toLowerCase();
    return reviews.filter(
      (r) =>
        (r.reviewerName && r.reviewerName.toLowerCase().includes(q)) ||
        (r.comment && r.comment.toLowerCase().includes(q))
    );
  }, [reviews, searchQuery]);

  const visibleReviews = filteredReviews.slice(0, visibleCount);
  const hasMore = visibleCount < filteredReviews.length;
  const publishedCount = reviews.filter((r) => r.isPublished).length;

  // Handlers
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
    } catch (err) {
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

  function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
   if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
   if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
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

return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage and respond to all your Google reviews
          </p>
        </div>
        {reviews.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              <span className="font-semibold text-green-600">{publishedCount}</span> of{' '}
              <span className="font-semibold text-gray-700">{reviews.length}</span>{' '}
              published to widget
            </span>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalReviews}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Avg Rating</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {stats.averageRating.toFixed(1)} <span className="text-yellow-400 text-lg">★</span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Needs Reply</div>
            <div className={`text-2xl font-bold mt-1 ${stats.unreplied > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.unreplied}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Reply Rate</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalReviews > 0
                ? Math.round(((stats.totalReviews - stats.unreplied) / stats.totalReviews) * 100)
                : 0}
              %
            </div>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name or comment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Location Filter */}
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.title}
              </option>
            ))}
          </select>

          {/* Rating Filter */}
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Reply Status Filter */}
          <select
            value={replyFilter}
            onChange={(e) => setReplyFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="needs_reply">Needs Reply</option>
            <option value="replied">Replied</option>
          </select>
        </div>

        {/* Active filter chips */}
        {(selectedLocationId || ratingFilter || replyFilter || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Filters:</span>
            {selectedLocationId && (
              <button
                onClick={() => setSelectedLocationId('')}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100"
              >
                {locations.find((l) => l.id === selectedLocationId)?.title}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {ratingFilter && (
              <button
                onClick={() => setRatingFilter('')}
                className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full hover:bg-yellow-100"
              >
                {ratingFilter} Stars
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {replyFilter && (
              <button
                onClick={() => setReplyFilter('')}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full hover:bg-purple-100"
              >
                {replyFilter === 'needs_reply' ? 'Needs Reply' : 'Replied'}
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200"
              >
                &ldquo;{searchQuery}&rdquo;
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button
              onClick={() => {
                setSelectedLocationId('');
                setRatingFilter('');
                setReplyFilter('');
                setSearchQuery('');
              }}
              className="text-xs text-gray-500 hover:text-gray-700 underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      {!loading && (
        <div className="text-sm text-gray-500 mb-4">
          Showing {Math.min(visibleCount, filteredReviews.length)} of {filteredReviews.length} reviews
          {filteredReviews.length !== reviews.length && (
            <span className="text-gray-400"> (filtered from {reviews.length})</span>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="font-semibold text-gray-900">No reviews found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {reviews.length > 0
              ? 'Try adjusting your filters or search query.'
              : 'Sync your locations to pull in reviews from Google.'}
          </p>
        </div>
      ) : (
        <>
          {/* Review Cards */}
          <div className="space-y-4">
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
              >
                {/* Review Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {review.reviewerPhoto ? (
                      <img
                        src={review.reviewerPhoto}
                        alt=""
                        className="w-10 h-10 rounded-full flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium flex-shrink-0">
                        {(review.reviewerName || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {review.reviewerName || 'Anonymous'}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {renderStars(review.starRating)}
                        <span className="text-xs text-gray-400">
                          {timeAgo(review.googleCreatedAt)}
                        </span>
                        {review.location?.title && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            {review.location.title}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Publish Toggle */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-xs font-medium hidden sm:inline ${
                        review.isPublished ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {review.isPublished ? 'Published' : 'Unpublished'}
                    </span>
                    <button
                      onClick={() => togglePublish(review.id)}
                      disabled={togglingId === review.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        togglingId === review.id
                          ? 'opacity-50 cursor-wait'
                          : 'cursor-pointer'
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

                {/* Review Comment */}
                {review.comment ? (
                  <p className="mt-3 text-gray-700 text-sm leading-relaxed">
                    {review.comment}
                  </p>
                ) : (
                  <p className="mt-3 text-gray-400 text-sm italic">No comment</p>
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
                        onClick={() => handleDeleteReply(review.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-blue-900">{review.reviewReply}</p>
                  </div>
                )}

                {/* Reply Form & AI Generator */}
                {!review.reviewReply && (
                  <>
                    {replyingId === review.id ? (
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
                            onClick={() => handleReply(review.id)}
                            disabled={submittingReply || !replyText.trim()}
                            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            {submittingReply ? 'Posting...' : 'Post Reply'}
                          </button>
                          <button
                            onClick={() => {
                              setReplyingId(null);
                              setReplyText('');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <button
                          onClick={() => setReplyingId(review.id)}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Reply →
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

          {/* Load More */}
          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setVisibleCount((prev) => prev + REVIEWS_PER_PAGE)}
                className="px-6 py-2.5 bg-white border border-gray-300 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Load more reviews ({filteredReviews.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
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
