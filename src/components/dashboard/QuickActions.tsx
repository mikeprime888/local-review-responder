'use client';

import { RefreshCw, MapPin, Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function QuickActions() {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // TODO: Implement sync API call
      const response = await fetch('/api/reviews/sync', { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        alert(`Synced ${data.newReviews || 0} new reviews!`);
        window.location.reload();
      } else {
        alert('Sync failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="space-y-2">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            className={`h-4 w-4 mr-3 ${syncing ? 'animate-spin' : ''}`}
          />
          {syncing ? 'Syncing...' : 'Sync Reviews'}
        </button>

        <Link
          href="/dashboard/locations"
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <MapPin className="h-4 w-4 mr-3" />
          Manage Locations
        </Link>

        <Link
          href="/dashboard/notifications"
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Bell className="h-4 w-4 mr-3" />
          Notifications
        </Link>

        <Link
          href="/dashboard/settings"
          className="w-full flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Link>
      </div>
    </div>
  );
}
