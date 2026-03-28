'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BusinessSearch } from '@/components/dashboard/BusinessSearch';

function NoLocationsFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">No Business Locations Found</h2>
        <p className="text-gray-600 mb-6">
          We connected your Google account but couldn&apos;t find any Google Business Profile
          locations. Make sure you have Owner or Manager access on a Google Business Profile.
        </p>
        <div className="space-y-3">
          <a
            href="/api/auth/link-google"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3.5 font-semibold transition-colors"
          >
            Try a Different Google Account
          </a>
          <a
            href="mailto:support@localreviewresponder.com"
            className="flex items-center justify-center gap-2 w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl px-6 py-3.5 font-medium transition-colors"
          >
            Contact Support
          </a>
          <a
            href="/dashboard?setup=skipped"
            className="block text-sm text-gray-400 hover:text-gray-600 underline mt-2"
          >
            Skip for now
          </a>
        </div>
        <div className="mt-6 bg-gray-50 rounded-lg p-4 text-left">
          <h3 className="font-medium text-gray-900 mb-2 text-sm">Common reasons this happens:</h3>
          <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
            <li>You signed in with a personal Google account instead of the one that manages your business</li>
            <li>Your business listing is owned by someone else who hasn&apos;t added you as a Manager</li>
            <li>You haven&apos;t created a Google Business Profile yet</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function OnboardingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);

  const step = searchParams.get('step');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    // Skip location check for no-locations screen
    if (step === 'no-locations') {
      setChecking(false);
      return;
    }

    const checkLocations = async () => {
      try {
        const response = await fetch('/api/subscriptions?active=true');
        if (!response.ok) {
          setChecking(false);
          return;
        }
        const data = await response.json();
        if (data.locations?.length > 0 || data.isAdmin || data.isComped) {
          router.replace('/dashboard');
          return;
        }
      } catch {
        // fetch failed — don't redirect
      }
      setChecking(false);
    };

    checkLocations();
  }, [status, router, step]);

  if (status === 'loading' || checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (step === 'no-locations') {
    return <NoLocationsFound />;
  }

  const hasGoogleToken = !!(session?.user as { hasGoogleAccount?: boolean })?.hasGoogleAccount;
  return <BusinessSearch hasGoogleToken={hasGoogleToken} userEmail={session?.user?.email || ''} />;
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
