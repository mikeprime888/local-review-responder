'use client';

import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">Stay updated on new reviews and activity</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Notification settings and alerts for new reviews, responses, and rating changes are coming soon.
        </p>
      </div>
    </div>
  );
}
