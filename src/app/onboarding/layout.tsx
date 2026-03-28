'use client';

import { SessionProvider } from 'next-auth/react';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="mb-8">
          <div className="flex items-center space-x-2">
            <img src="/logo.svg" alt="Local Review Responder" className="h-6 w-6" />
            <span className="text-base font-bold text-gray-900">Local Review</span>
          </div>
        </div>
        {children}
      </div>
    </SessionProvider>
  );
}
