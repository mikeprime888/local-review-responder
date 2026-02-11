'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import LocationSwitcher from '@/components/dashboard/LocationSwitcher';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { SyncButton } from '@/components/dashboard/SyncButton';
import Link from 'next/link';

interface Location {
  id: string;
  title: string;
  address: string | null;
  averageRating: number;
  totalReviews: number;
  isActive: boolean;
  subscription: {
    status: string;
    trialEnd: string | null;
  } | null;
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
  location: { title: string };
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  unrepliedCount: number;
  unreplied: number;
  ratingBreakdown: Record<number, number>;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function RatingDistribution({ breakdown, total }: { breakdown: Record<number, number>; total: number }) {
  const colors: Record<number, string> = {
    5: 'bg-green-500',
    4: 'bg-green-400',
    3: 'bg-yellow-400',
    2: 'bg-orange-400',
    1: 'bg-red-400',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Rating Distribution</h3>
      <div className="space-y-2.5">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = breakdown[rating] || 0;
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-8 flex-shrink-0">{rating} ★</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div
                  className={`${colors[rating]} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-sm text-gray-500 w-10 text-right flex-shrink-0">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecentReviewCard({ review }: { review: Review }) {
  const initial = (review.reviewerName || 'A')[0].toUpperCase();
  const hasReply = !!review.reviewReply;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {review.reviewerPhoto ? (
          <img
            src={review.reviewerPhoto}
            alt=""
            className="w-9 h-9 rounded-full flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initial}
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Name + Rating + Time */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate">
                {review.reviewerName || 'Anonymous'}
              </span>
              <StarRating rating={review.starRating} />
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {timeAgo(review.googleCreatedAt)}
            </span>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-gray-600 line-clamp-2">{review.comment}</p>
          )}

          {/* Reply status badge */}
          <div className="mt-2">
            {hasReply ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Replied
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" />
                </svg>
                Needs reply
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  // Check for success message from Stripe
  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      setSuccessMessage('🎉 Location added successfully! Your 14-day free trial has started.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch locations
  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch('/api/subscriptions?active=true');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLocations(data.locations || []);
      
      // Restore selected location from localStorage or use first
      const savedLocationId = localStorage.getItem('selectedLocationId');
      if (data.locations?.length > 0) {
        const savedExists = data.locations.some((l: Location) => l.id === savedLocationId);
        if (savedExists && savedLocationId) {
          setSelectedLocationId(savedLocationId);
        } else {
          setSelectedLocationId(data.locations[0].id);
        }
      }
    } catch (err: unknown) {
      console.error('Error fetching locations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch reviews for selected location
  const fetchReviews = useCallback(async (locationId: string) => {
    try {
      const response = await fetch(`/api/google/reviews?locationId=${locationId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
setReviews(data.reviews || []);
      if (data.stats) {
        setStats({
          ...data.stats,
          unreplied: data.stats.unreplied ?? data.stats.unrepliedCount ?? 0,
          unrepliedCount: data.stats.unrepliedCount ?? data.stats.unreplied ?? 0,
        });
      } else {
        setStats(null);
      }
    } catch (err: unknown) {
      console.error('Error fetching reviews:', err);
    }
  }, []);

  // Load locations on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchLocations();
    }
  }, [status, fetchLocations]);

  // Load reviews when location changes
  useEffect(() => {
    if (selectedLocationId) {
      fetchReviews(selectedLocationId);
      // Persist selection
      localStorage.setItem('selectedLocationId', selectedLocationId);
    }
  }, [selectedLocationId, fetchReviews]);

  // Handle sync
  const handleSync = async () => {
    if (!selectedLocationId || syncing) return;
    setSyncing(true);
    setError(null);
    try {
      const response = await fetch('/api/google/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: selectedLocationId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      // Refresh reviews after sync
      await fetchReviews(selectedLocationId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      setError(message);
    } finally {
      setSyncing(false);
    }
  };

  // Handle location change
  const handleLocationChange = (locationId: string) => {
    setSelectedLocationId(locationId);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📍</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Locations Found</h2>
          <p className="text-gray-600 mb-6">Connect your Google Business Profile to get started.</p>
          <Link
            href="/dashboard/locations"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Go to Locations
          </Link>
        </div>
      </div>
    );
  }

  // Get 5 most recent reviews
  const recentReviews = reviews.slice(0, 5);
  const repliedCount = stats ? stats.totalReviews - stats.unrepliedCount : 0;
  const replyRate = stats && stats.totalReviews > 0
    ? Math.round((repliedCount / stats.totalReviews) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
            ✕
          </button>
        </div>
      )}

      {/* Trial Banner */}
      {selectedLocation?.subscription?.status === 'trialing' && selectedLocation.subscription.trialEnd && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Free trial ends {new Date(selectedLocation.subscription.trialEnd).toLocaleDateString()}
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && <StatsBar stats={stats} />}

      {/* Two Column Layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Reviews */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Reviews</h2>
            <Link
              href="/dashboard/reviews"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View all {stats?.totalReviews || ''} reviews
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {recentReviews.length > 0 ? (
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <RecentReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center text-gray-500">
              No reviews yet for this location.
            </div>
          )}
        </div>

        {/* Right Column - Rating Distribution + Quick Actions */}
        <div className="space-y-6">
          {/* Rating Distribution */}
          {stats && (
            <RatingDistribution
              breakdown={stats.ratingBreakdown}
              total={stats.totalReviews}
            />
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/reviews"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700"
              >
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </span>
                <div>
                  <div className="font-medium">Manage Reviews</div>
                  <div className="text-xs text-gray-500">Reply, filter, and search reviews</div>
                </div>
              </Link>
              <Link
                href="/dashboard/widget"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700"
              >
                <span className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </span>
                <div>
                  <div className="font-medium">Review Widget</div>
                  <div className="text-xs text-gray-500">Embed reviews on your website</div>
                </div>
              </Link>
              <Link
                href="/dashboard/notifications"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700"
              >
                <span className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </span>
                <div>
                  <div className="font-medium">Notifications</div>
                  <div className="text-xs text-gray-500">Email alerts for new reviews</div>
                </div>
              </Link>
              <Link
                href="/dashboard/billing"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-sm text-gray-700"
              >
                <span className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </span>
                <div>
                  <div className="font-medium">Billing</div>
                  <div className="text-xs text-gray-500">Manage subscription and payment</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Needs Reply Alert */}
          {stats && stats.unrepliedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-amber-900">
                    {stats.unrepliedCount} review{stats.unrepliedCount !== 1 ? 's' : ''} need{stats.unrepliedCount === 1 ? 's' : ''} a reply
                  </div>
                  <Link
                    href="/dashboard/reviews?replyStatus=unreplied"
                    className="text-sm text-amber-700 hover:text-amber-900 font-medium"
                  >
                    Reply now →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
