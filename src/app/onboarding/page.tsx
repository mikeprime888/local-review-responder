'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BusinessSearch } from '@/components/dashboard/BusinessSearch';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    const checkLocations = async () => {
      try {
        const response = await fetch('/api/subscriptions?active=true');
        if (!response.ok) {
          setChecking(false);
          return; // API failed — don't redirect, show onboarding
        }
        const data = await response.json();
        if (data.locations?.length > 0) {
          router.replace('/dashboard');
          return;
        }
      } catch {
        // fetch failed — don't redirect
      }
      setChecking(false);
    };

    checkLocations();
  }, [status, router]);

  if (status === 'loading' || checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const hasGoogleToken = !!(session?.user as { hasGoogleAccount?: boolean })?.hasGoogleAccount;

  return <BusinessSearch hasGoogleToken={hasGoogleToken} userEmail={session?.user?.email || ''} />;
}
