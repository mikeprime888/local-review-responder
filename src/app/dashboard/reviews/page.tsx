'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ReviewCard from '@/components/dashboard/ReviewCard';

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

export default function ReviewsPage() {
  const { data: session } = useSession();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'published' | 'unpublished'>('all');
  const [starFilter, setStarFilter] = useState<number>(0);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Get current location from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLocationId = localStorage.getItem('currentLocationId');
      if (storedLocationId) {
        setLocationId(storedLocationId);
      }
    }
  }, []);

  // Fetch reviews
  useEffect(() => {
    if (!locationId) return;

    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/locations/${locationId}/reviews`);
        if (!res.ok) throw new Error('Failed to fetch reviews');
        
        const data = await res.json();
        setReviews(data.reviews || []);
      } catch (err) {
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [locationId]);

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    if (filter === 'published' && !review.isPublished) return false;
    if (filter === 'unpublished' && review.isPublished) return false;
    if (starFilter > 0 && review.starRating !== starFilter) return false;
    return true;
  });

  const handleSelectAll = () => {
    if (selectedReviews.size === filteredReviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(filteredReviews.map((r) => r.id)));
    }
  };

  const handleSelectReview = (reviewId: string) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const handleBulkAction = async (action: string, minStars?: number) => {
    if (!locationId) return;

    setBulkLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const body: Record<string, unknown> = { locationId, action };
      
      if (minStars) body.minStars = minStars;
      if (selectedReviews.size > 0 && (action === 'publish_selected' || action === 'unpublish_selected')) {
        body.reviewIds = Array.from(selectedReviews);
      }

      const res = await fetch('/api/reviews/bulk-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Bulk action failed');

      const data = await res.json();
      setSuccessMessage(`Successfully updated ${data.updatedCount} reviews`);
      
      // Refresh reviews
      const refreshRes = await fetch(`/api/locations/${locationId}/reviews`);
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setReviews(refreshData.reviews || []);
      }
      
      setSelectedReviews(new Set());
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to perform bulk action');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleReviewUpdate = (reviewId: string, updates: Partial<Review>) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, ...updates } : r))
    );
  };

  // Stats
  const publishedCount = reviews.filter((r) => r.isPublished).length;
  const featuredCount = reviews.filter((r) => r.isFeatured).length;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.starRating, 0) / reviews.length).toFixed(1)
      : '0.0';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!locationId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please select a location first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-600 mt-1">
          Manage which reviews appear on your website widget
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Reviews</p>
          <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Published</p>
          <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Featured</p>
          <p className="text-2xl font-bold text-yellow-600">{featuredCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Average Rating</p>
          <p className="text-2xl font-bold text-gray-900">{avgRating} ⭐</p>
        </div>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Status:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'published' | 'unpublished')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Stars:</label>
            <select
              value={starFilter}
              onChange={(e) => setStarFilter(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="0">All</option>
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
          </div>

          <div className="flex-1" />

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedReviews.size > 0 ? `${selectedReviews.size} selected` : 'Bulk actions:'}
            </span>
            
            {selectedReviews.size > 0 ? (
              <>
                <button
                  onClick={() => handleBulkAction('publish_selected')}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Publish Selected
                </button>
                <button
                  onClick={() => handleBulkAction('unpublish_selected')}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  Unpublish Selected
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleBulkAction('publish_by_stars', 4)}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Publish 4+ Stars
                </button>
                <button
                  onClick={() => handleBulkAction('publish_all')}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Publish All
                </button>
                <button
                  onClick={() => handleBulkAction('unpublish_all')}
                  disabled={bulkLoading}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Unpublish All
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Select All */}
      {filteredReviews.length > 0 && (
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedReviews.size === filteredReviews.length}
              onChange={handleSelectAll}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">
              Select all ({filteredReviews.length} reviews)
            </span>
          </label>
        </div>
      )}

      {/* Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">No reviews found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((review) => (
            <div key={review.id} className="relative">
              {/* Selection checkbox */}
              <div className="absolute top-4 left-4 z-10">
                <input
                  type="checkbox"
                  checked={selectedReviews.has(review.id)}
                  onChange={() => handleSelectReview(review.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="pl-8">
                <ReviewCard
                  review={review}
                  onUpdate={handleReviewUpdate}
                  showPublishControls={true}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
