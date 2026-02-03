'use client';

import { useState, useRef, useEffect } from 'react';

interface SyncButtonProps {
  onSyncAll: () => void;
  onSyncReviews: () => void;
  syncing: boolean;
}

export function SyncButton({ onSyncAll, onSyncReviews, syncing }: SyncButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        disabled={syncing}
        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
      >
        {syncing ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Syncing...
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Sync
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && !syncing && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-10">
          <button
            onClick={() => {
              setOpen(false);
              onSyncAll();
            }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b"
          >
            <div className="font-medium text-sm text-gray-900">
              Sync All
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Fetch locations + reviews from Google
            </div>
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onSyncReviews();
            }}
            className="w-full text-left px-4 py-3 hover:bg-gray-50"
          >
            <div className="font-medium text-sm text-gray-900">
              Sync Reviews Only
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              Refresh reviews for existing locations
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
