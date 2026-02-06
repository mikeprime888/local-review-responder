'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { ReviewList } from '@/components/dashboard/ReviewList';

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

function ReviewsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const locationId = searchParams.get('locationId') || '';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const url = locationId
        ? `/api/reviews?locationId=${locationId}`
        : '/api/reviews';
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

  const handleReply = async (reviewId: string, comment: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });
      if (res.ok) {
        await fetchReviews();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const handleDeleteReply = async (reviewId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchReviews();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="text-gray-500 mt-1">View and manage all your Google reviews</p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No reviews found. Sync your locations to pull in reviews.</p>
        </div>
      ) : (
        <ReviewList
          reviews={reviews}
          onReply={handleReply}
          onDeleteReply={handleDeleteReply}
        />
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