'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import LocationSwitcher from '@/components/dashboard/LocationSwitcher';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { ReviewList } from '@/components/dashboard/ReviewList';
import { SyncButton } from '@/components/dashboard/SyncButton';

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
  isPublished: boolean;
  publishedAt: string | null;
  location: { title: string };
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  unreplied: number;
  ratingBreakdown: Record<number, number>;
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
  const [hasGoogleAccount, setHasGoogleAccount] = useState<boolean | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      setSuccessMessage('Location added successfully! Your 14-day free trial has started.');
      window.history.replaceState({}, '', '/dashboard');
    }
    if (searchParams.get('linked') === 'true') {
      setSuccessMessage('Google account connected successfully! You can now add your business locations.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Check Google account status
  useEffect(() => {
    if (status === 'authenticated') {
      // Check from session first
      const sessionHasGoogle = (session?.user as any)?.hasGoogleAccount;
      if (sessionHasGoogle !== undefined) {
        setHasGoogleAccount(sessionHasGoogle);
      } else {
        // Fallback: check via API
        fetch('/api/auth/check-google')
          .then(res => res.json())
          .then(data => setHasGoogleAccount(data.hasGoogleAccount))
          .catch(() => setHasGoogleAccount(false));
      }
    }
  }, [status, session]);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch('/api/subscriptions?active=true');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch locations');
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
      const response = await fetch('/api/google/reviews?locationId=' + locationId);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch reviews');
      const loc = locations.find(l => l.id === locationId);
      const reviewsWithLocation = (data.reviews || []).map((r: any) => ({
        ...r,
        location: { title: loc?.title || '' }
      }));
      setReviews(reviewsWithLocation);
      setStats(data.stats || null);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
    }
  }, [locations]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLocations().finally(() => setLoading(false));
    }
  }, [status, fetchLocations]);

  useEffect(() => {
    if (selectedLocationId) fetchReviews(selectedLocationId);
  }, [selectedLocationId, fetchReviews]);

  const handleSyncAll = async () => {
    if (!selectedLocationId) return;
    setSyncing(true);
    setError(null);
    try {
      await fetch('/api/google/locations?sync=true');
      await fetchLocations();
      await fetch('/api/google/reviews?sync=true&locationId=' + selectedLocationId);
      await fetchReviews(selectedLocationId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncReviews = async () => {
    if (!selectedLocationId) return;
    setSyncing(true);
    setError(null);
    try {
      await fetch('/api/google/reviews?sync=true&locationId=' + selectedLocationId);
      await fetchReviews(selectedLocationId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleReply = async (reviewId: string, replyText: string): Promise<boolean> => {
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
      if (selectedLocationId) await fetchReviews(selectedLocationId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const handleDeleteReply = async (reviewId: string): Promise<boolean> => {
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
      if (selectedLocationId) await fetchReviews(selectedLocationId);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const handleConnectGoogle = () => {
    setConnectingGoogle(true);
    signIn('google', { callbackUrl: '/dashboard?linked=true' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Empty state: No locations yet
  if (locations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Local Review Responder</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session?.user?.email}</span>
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-16 text-center">
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center justify-between">
              <span>{successMessage}</span>
              <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {hasGoogleAccount === false ? (
            // User registered with email/password, no Google linked yet
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Google Account</h2>
              <p className="text-gray-600 mb-4">
                To manage your business reviews, you need to connect the Google account that has access to your Google Business Profile.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">Before you connect, make sure:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ You have a Google Business Profile for your business</li>
                  <li>✓ You are listed as an Owner or Manager on the profile</li>
                  <li>✓ You know which Google account has access</li>
                </ul>
                <p className="text-sm text-blue-700 mt-3">
                  Don&apos;t have a Google Business Profile yet?{' '}
                  <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                    Set one up here
                  </a>
                </p>
              </div>
              <button
                onClick={handleConnectGoogle}
                disabled={connectingGoogle}
                className="inline-flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 disabled:opacity-50"
              >
                {connectingGoogle ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Connect Google Account
              </button>
              <p className="text-xs text-gray-500 mt-4">
                We&apos;ll only access your Google Business Profile data. Check your email for a guide on getting set up.
              </p>
            </div>
          ) : (
            // User has Google linked, show add location flow
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Local Review Responder!</h2>
              <p className="text-gray-600 mb-8">Get started by adding your first business location. You will get a 14-day free trial.</p>
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
          )}
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
            <SyncButton onSyncAll={handleSyncAll} onSyncReviews={handleSyncReviews} syncing={syncing} />
            <span className="text-sm text-gray-600">{session?.user?.email}</span>
            <button onClick={() => signOut({ callbackUrl: '/login' })} className="text-sm text-gray-500 hover:text-gray-700">Sign out</button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 flex items-center justify-between">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
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
              <span>Free trial ends {new Date(selectedLocation.subscription.trialEnd).toLocaleDateString()}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
            <button onClick={() => setError(null)} className="ml-4 text-red-600 hover:text-red-800">Dismiss</button>
          </div>
        )}

        {stats && <StatsBar stats={stats} />}

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Reviews for {selectedLocation?.title}</h2>
          <ReviewList reviews={reviews} onReply={handleReply} onDeleteReply={handleDeleteReply} />
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <DashboardContent />
    </Suspense>
  );
}
