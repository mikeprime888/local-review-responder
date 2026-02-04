'use client';

import { SessionProvider } from 'next-auth/react';
import { Sidebar } from '@/components/dashboard/Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content - offset by sidebar width */}
        <div className="pl-64">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
