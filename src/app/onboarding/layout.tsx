'use client';

import { SessionProvider } from 'next-auth/react';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen" style={{ backgroundColor: '#f5f1ea' }}>
        {children}
      </div>
    </SessionProvider>
  );
}
