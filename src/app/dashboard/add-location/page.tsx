'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Location {
  id: string;
  title: string;
  address: string | null;
  averageRating: number | null;
  totalReviews: number;
  googleAccountName: string | null;
}

function AddLocationContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState<string | null>(null);

  const wasCanceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchAvailableLocations();
    }
  }, [status, router]);

  const fetchAvailableLocations = async (sync = false) => {
    try {
      if (sync) setSyncing(true);
      setError(null);
      const url = sync ? '/api/subscriptions?available=true&sync=true' : '/api/subscriptions?available=true';
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch locations');
      setLocations(data.locations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleAddLocation = async (locationId: string) => {
    try {
      setCheckoutLoading(locationId);
      setError(null);
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, plan: selectedPlan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setCheckoutLoading(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          cat > ~/Desktop/local-review-responder/src/app/dashboard/add-location/page.tsx << 'ENDOFFILE'
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Location {
  id: string;
  title: string;
  address: string | null;
  averageRating: number | null;
  totalReviews: number;
  googleAccountName: string | null;
}

function AddLocationContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [error, setError] = useState<string | null>(null);

  const wasCanceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchAvailableLocations();
    }
  }, [status, router]);

  const fetchAvailableLocations = async (sync = false) => {
    try {
      if (sync) setSyncing(true);
      setError(null);
      const url = sync ? '/api/subscriptions?available=true&sync=true' : '/api/subscriptions?available=true';
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch locations');
      setLocations(data.locations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleAddLocation = async (locationId: string) => {
    try {
      setCheckoutLoading(locationId);
      setError(null);
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, plan: selectedPlan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create checkout session');
      if (data.url) window.location.href = data.url;
    } catch (err: any) {
      setError(err.message);
      setCheckoutLoading(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Add Location</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {wasCanceled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            Checkout was canceled. Select a location to try again.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Your Plan</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`flex-1 p-4 rounded-lg border-2 transition ${selectedPlan === 'monthly' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="font-semibold text-gray-900">Monthly</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">$29<span className="text-sm font-normal text-gray-500">/mo</span></div>
            </button>
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`flex-1 p-4 rounded-lg border-2 transition ${selectedPlan === 'yearly' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="font-semibold text-gray-900">Yearly <span className="text-green-600 text-sm">(Save $58)</span></div>
              <div className="text-2xl font-bold text-gray-900 mt-1">$290<span className="text-sm font-normal text-gray-500">/yr</span></div>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">All plans include a 14-day free trial</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Google Business Locations</h2>
            <button
              onClick={() => fetchAvailableLocations(true)}
              disabled={syncing}
              className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Refresh from Google'}
            </button>
          </div>

          {locations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No available locations found.</p>
              <p className="text-sm mt-2">All your locations may already be subscribed, or you need to sync from Google.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <div className="font-medium text-gray-900">{location.title}</div>
                    {location.address && <div className="text-sm text-gray-500">{location.address}</div>}
                    <div className="text-sm text-gray-400 mt-1">
                      {location.averageRating && `${location.averageRating} stars • `}{location.totalReviews} reviews
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddLocation(location.id)}
                    disabled={checkoutLoading === location.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                  >
                    {checkoutLoading === location.id ? 'Loading...' : 'Add Location'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AddLocationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>}>
      <AddLocationContent />
    </Suspense>
  );
}
