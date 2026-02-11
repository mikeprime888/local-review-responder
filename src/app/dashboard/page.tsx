'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
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
  const [hasGoogleAccount, setHasGoogleAccount] = useState<boolean | null>(null);
  const [connectingGoogle, setConnectingGoogle] = useState(false);

  const wasCanceled = searchParams.get('canceled') === 'true';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      checkGoogleAndFetch();
    }
  }, [status, router]);

  const checkGoogleAndFetch = async () => {
    try {
      // Check from session first
      const sessionHasGoogle = (session?.user as any)?.hasGoogleAccount;
      if (sessionHasGoogle !== undefined) {
        setHasGoogleAccount(sessionHasGoogle);
        if (sessionHasGoogle) {
          await fetchAvailableLocations();
        }
      } else {
        // Fallback: check via API
        const res = await fetch('/api/auth/check-google');
        const data = await res.json();
        setHasGoogleAccount(data.hasGoogleAccount);
        if (data.hasGoogleAccount) {
          await fetchAvailableLocations();
        }
      }
    } catch {
      setHasGoogleAccount(false);
    } finally {
      setLoading(false);
    }
  };

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

  const handleConnectGoogle = () => {
    setConnectingGoogle(true);
    signIn('google', { callbackUrl: '/dashboard/add-location' });
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

        {hasGoogleAccount === false ? (
          // No Google account linked — show connect prompt
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Connect Your Google Account First</h2>
            <p className="text-gray-600 mb-6">
              To add a business location, we need access to your Google Business Profile. Connect the Google account that manages your business listing.
            </p>
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
            <div className="mt-6 bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-medium text-gray-900 mb-2 text-sm">Need help getting set up?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Make sure you&apos;re an Owner or Manager on your <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google Business Profile</a></li>
                <li>• If someone else manages your listing, ask them to add you as a Manager</li>
                <li>• Check your email for a detailed setup guide</li>
              </ul>
            </div>
          </div>
        ) : (
          // Google account linked — show plan selection and locations
          <>
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
                          {location.averageRating && `${location.averageRating} stars - `}{location.totalReviews} reviews
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
          </>
        )}
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
