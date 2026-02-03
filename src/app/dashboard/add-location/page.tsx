'use client';

import { useEffect, useState } from 'react';
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

export default function AddLocationPage() {
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
      
      const url = sync 
        ? '/api/subscriptions?available=true&sync=true'
        : '/api/subscriptions?available=true';
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch locations');
      }

      setLocations(data.locations || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleSubscribe = async (locationId: string) => {
    try {
      setCheckoutLoading(locationId);
      setError(null);

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          priceType: selectedPlan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message);
      setCheckoutLoading(null);
    }
  };

  const formatRating = (rating: number | null) => {
    if (!rating) return 'No rating';
    return '★'.repeat(Math.round(rating)) + ` ${rating.toFixed(1)}`;
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
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            href="/dashboard" 
            className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Add Location</h1>
        <p className="text-gray-600 mb-8">
          Select a business from your Google Business Profile to start managing reviews.
        </p>

        {/* Alerts */}
        {wasCanceled && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            Checkout was canceled. You can try again when you&apos;re ready.
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Plan Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Plan</h2>
          <div className="flex gap-4">
            <label 
              className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedPlan === 'monthly' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="plan"
                value="monthly"
                checked={selectedPlan === 'monthly'}
                onChange={() => setSelectedPlan('monthly')}
                className="sr-only"
              />
              <div className="font-semibold text-gray-900">Monthly</div>
              <div className="text-2xl font-bold text-gray-900">$29<span className="text-sm font-normal text-gray-500">/mo</span></div>
              <div className="text-sm text-gray-500 mt-1">Billed monthly</div>
            </label>

            <label 
              className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-colors relative ${
                selectedPlan === 'yearly' 
                  ? 'border-blue-600 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="plan"
                value="yearly"
                checked={selectedPlan === 'yearly'}
                onChange={() => setSelectedPlan('yearly')}
                className="sr-only"
              />
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save $58
              </span>
              <div className="font-semibold text-gray-900">Annual</div>
              <div className="text-2xl font-bold text-gray-900">$290<span className="text-sm font-normal text-gray-500">/yr</span></div>
              <div className="text-sm text-gray-500 mt-1">2 months free</div>
            </label>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            ✓ 14-day free trial &nbsp;•&nbsp; ✓ Cancel anytime
          </p>
        </div>

        {/* Sync Button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Your Google Business Locations
          </h2>
          <button
            onClick={() => fetchAvailableLocations(true)}
            disabled={syncing}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <svg 
              className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {syncing ? 'Syncing...' : 'Refresh from Google'}
          </button>
        </div>

        {/* Locations List */}
        {locations.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Locations</h3>
            <p className="text-gray-500 mb-4">
              All your Google Business locations are already subscribed, or we couldn&apos;t find any locations.
            </p>
            <button
              onClick={() => fetchAvailableLocations(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Sync from Google
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{location.title}</h3>
                  {location.address && (
                    <p className="text-sm text-gray-500 mt-0.5">{location.address}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-yellow-600">
                      {formatRating(location.averageRating)}
                    </span>
                    <span className="text-gray-500">
                      {location.totalReviews} reviews
                    </span>
                    {location.googleAccountName && (
                      <span className="text-gray-400">
                        {location.googleAccountName}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleSubscribe(location.id)}
                  disabled={checkoutLoading === location.id}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {checkoutLoading === location.id ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Location
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
