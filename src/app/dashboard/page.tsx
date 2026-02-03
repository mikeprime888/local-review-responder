'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LocationList } from '@/components/dashboard/LocationList';
import { ReviewList } from '@/components/dashboard/ReviewList';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { SyncButton } from '@/components/dashboard/SyncButton';

interface Location {
  id: string;
  title: string;
  address: string | null;
  phone: string | null;
  googleAccountId: string;
  googleAccountName: string | null;
  locationId: string;
  averageRating: number | null;
  totalReviews: number;
  lastSyncedAt: string | null;
  _count?: { reviews: number };
}

interface Review {
  id: string;
  googleReviewId: string;
  reviewerName: string | null;
  reviewerPhoto: string | null;
  starRating: number;
  comment: string | null;
  reviewReply: string | null;
  replyTime: string | null;
  googleCreatedAt: string;
  location: {
    title: string;
    googleAccountId: string;
    locationId: string;
  };
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: Record<number, number>;
  unreplied: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [locations, setLocations] = useState<Location[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Load data on mount
  useEffect(() => {
    if (session?.user) {
      loadLocations();
      loadReviews();
    }
  }, [session]);

  // Reload reviews when location filter changes
  useEffect(() => {
    if (session?.user) {
      loadReviews();
    }
  }, [selectedLocation]);

  async function loadLocations() {
    try {
      const res = await fetch('/api/google/locations');
      const data = await res.json();
      if (res.ok) {
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    try {
      const params = new URLSearchParams();
      if (selectedLocation) params.set('locationId', selectedLocation);

      const res = await fetch(`/api/google/reviews?${params}`);
      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  }

  async function handleSyncLocations() {
    setSyncing(true);
    setSyncMessage('');
    setError('');

    try {
      // Step 1: Sync locations from Google
      setSyncMessage('Fetching locations from Google...');
      
      // First get accounts
      const accountsRes = await fetch('/api/google/accounts');
      const accountsData = await accountsRes.json();
      
      if (!accountsRes.ok) {
        throw new Error(accountsData.error || 'Failed to fetch accounts');
      }

      const accounts = accountsData.accounts || [];
      if (accounts.length === 0) {
        throw new Error('No Google Business Profile accounts found for this Google account.');
      }

      // Sync locations for each account
      let totalLocations = 0;
      for (const account of accounts) {
        const accountId = account.name.replace('accounts/', '');
        const locRes = await fetch(`/api/google/locations?sync=true&accountId=${accountId}`);
        const locData = await locRes.json();
        
        if (locRes.ok) {
          totalLocations += locData.synced || 0;
        }
      }

      setSyncMessage(`Found ${totalLocations} locations. Now syncing reviews...`);

      // Step 2: Sync reviews
      const reviewRes = await fetch('/api/google/reviews?sync=true');
      const reviewData = await reviewRes.json();

      if (reviewRes.ok) {
        setSyncMessage(
          `✅ Synced ${totalLocations} locations and ${reviewData.synced} reviews!`
        );
      } else {
        throw new Error(reviewData.error || 'Failed to sync reviews');
      }

      // Reload data
      await loadLocations();
      await loadReviews();
    } catch (err: any) {
      console.error('Sync error:', err);
      setError(err.message || 'Sync failed');
      setSyncMessage('');
    } finally {
      setSyncing(false);
    }
  }

  async function handleSyncReviews() {
    setSyncing(true);
    setSyncMessage('Syncing reviews from Google...');
    setError('');

    try {
      const params = new URLSearchParams({ sync: 'true' });
      if (selectedLocation) params.set('locationId', selectedLocation);

      const res = await fetch(`/api/google/reviews?${params}`);
      const data = await res.json();

      if (res.ok) {
        setSyncMessage(`✅ ${data.message}`);
        await loadReviews();
        await loadLocations();
      } else {
        throw new Error(data.error || 'Failed to sync reviews');
      }
    } catch (err: any) {
      setError(err.message);
      setSyncMessage('');
    } finally {
      setSyncing(false);
    }
  }

  async function handleReply(reviewId: string, comment: string) {
    try {
      const res = await fetch('/api/google/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewDbId: reviewId, comment }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to post reply');
      }

      // Refresh reviews
      await loadReviews();
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  }

  async function handleDeleteReply(reviewId: string) {
    if (!confirm('Are you sure you want to delete this reply?')) return false;

    try {
      const res = await fetch('/api/google/reviews/reply', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewDbId: reviewId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete reply');
      }

      await loadReviews();
      return true;
    } catch (err: any) {
      alert(err.message);
      return false;
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Local Review Responder
            </h1>
            <p className="text-sm text-gray-500">
              Welcome, {session?.user?.name || session?.user?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SyncButton
              onSyncAll={handleSyncLocations}
              onSyncReviews={handleSyncReviews}
              syncing={syncing}
            />
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-4 py-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Sync Status Messages */}
        {syncMessage && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {syncMessage}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Empty State - No locations yet */}
        {locations.length === 0 && !syncing && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Locations Connected Yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Click &quot;Sync All&quot; to fetch your Google Business Profile locations
              and reviews.
            </p>
            <button
              onClick={handleSyncLocations}
              disabled={syncing}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Connect Google Business Profile'}
            </button>
          </div>
        )}

        {/* Dashboard with data */}
        {locations.length > 0 && (
          <>
            {/* Stats Bar */}
            {stats && <StatsBar stats={stats} />}

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Locations Sidebar */}
              <div className="lg:col-span-1">
                <LocationList
                  locations={locations}
                  selectedLocation={selectedLocation}
                  onSelectLocation={setSelectedLocation}
                />
              </div>

              {/* Reviews List */}
              <div className="lg:col-span-3">
                <ReviewList
                  reviews={reviews}
                  onReply={handleReply}
                  onDeleteReply={handleDeleteReply}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
