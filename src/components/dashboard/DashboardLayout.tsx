'use client';

import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Top Bar - visible on small screens only */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3 md:hidden">
          <div className="flex items-center space-x-2">
            <img src="/logo.svg" alt="Local Review Responder" className="h-6 w-6" />
            <span className="text-base font-bold text-gray-900">Local Review</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content - offset by sidebar width on desktop, full-width on mobile */}
        <div className="md:pl-64">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
