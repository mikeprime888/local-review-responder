'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import LocationSwitcher from '@/components/dashboard/LocationSwitcher';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { ReviewList } from '@/components/dashboard/ReviewList';
import { SyncButton } from '@/components/dashboard/SyncButton';

interface Location {
  id: string;
  title: string;
  address: string | null;
  averageRating: number | null;
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
}

interface Stats {
  totalReviews: number;
  averageRating: number | null;
  unrepliedCount: number;
  ratingBreakdown: Record<number, number>;
}

export default function DashboardPage() {
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

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      setSuccessMessage('🎉 Location added successfully! Your 14-day free trial has started.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch('/api/subscriptions?active=true');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch locations');
      }

      setLocations(data.locations || []);

      if (data.locations?.length > 0 && !selectedLocationId) {
        setSelectedLocationId(data.locations[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [selectedLocationId]);

  const fetchReviews = useCallback(async (locationId: string) => {
    try {
      const response = await fetch(`/api/google/reviews?locationId=${locationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      setReviews(data.reviews || []);
      setStats(data.stats || null);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLocations().finally(() => setLoading(false));
    }
  }, [status, fetchLocations]);

  useEffect(() => {
    if (selectedLocationId) {
      fetchReviews(selectedLocationId);
    }
  }, [selectedLocationId, fetchReviews]);

  const handleSync = async (type: 'all' | 'reviews') => {
    if (!selectedLocationId) return;
    
    setSyncing(true);
    setError(null);

    try {
      if (type === 'all') {
        await fetch('/api/google/locations?sync=true');
        await fetchLocations();
      }

      await fetch(`/api/google/reviews?sync=true&locationId=${selectedLocationId}`);
      await fetchReviews(selectedLocationId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleReply = async (reviewId: string, replyText: string) => {
    try {
      const response = await fetch('/api/google/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, replyText }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to post reply');
      }

      if (selectedLocationId) {
        await fetchReviews(selectedLocationId);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    try {
      const response = await fetch('/api/google/reviews/reply', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete reply');
      }

      if (selectedLocationId) {
        await fetchReviews(selectedLocationId);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Local Review Responder</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session?.user?.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Local Review Responder!</h2>
            <p className="text-gray-600 mb-8">
              Get started by adding your first business location. You will get a 14-day free trial.
            </p>
            <a
              href="/dashboard/add-location"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Your First Location
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-900">Local Review Responder</h1>
            <LocationSwitcher
              locations={locations}
              selectedLocationId={selectedLocationId}
              onLocationChange={setSelectedLocationId}
            />
          </div>
          <div className="flex items-center gap-4">
            <SyncButton onSync={handleSync} syncing={syncing} />
            <span className="text-sm text-gray-600">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center justify-between">
            <span>{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {selectedLocation?.subscription?.status === 'trialing' && selectedLocation.subscription.trialEnd && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Free trial ends {new Date(selectedLocation.subscription.trialEnd).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        {stats && <StatsBar stats={stats} />}

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reviews for {selectedLocation?.title}
          </h2>
          <ReviewList
            reviews={reviews}
            onReply={handleReply}
            onDeleteReply={handleDeleteReply}
          />
        </div>
      </main>
    </div>
  );
}
