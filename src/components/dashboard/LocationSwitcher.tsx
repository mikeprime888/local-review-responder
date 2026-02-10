'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Location {
  id: string;
  title: string;
  address: string | null;
  averageRating: number | null;
  totalReviews: number;
  isActive: boolean;
}

interface LocationSwitcherProps {
  locations: Location[];
  selectedLocationId: string | null;
  onLocationChange: (locationId: string) => void;
}

export default function LocationSwitcher({
  locations,
  selectedLocationId,
  onLocationChange,
}: LocationSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  // Filter locations by search
  const filteredLocations = locations.filter((loc) =>
    loc.title.toLowerCase().includes(search.toLowerCase()) ||
    loc.address?.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[65vw] md:max-w-none md:min-w-[200px]"
      >
        <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="flex-1 text-left text-sm md:text-base font-medium text-gray-900 truncate">
          {selectedLocation?.title || 'Select Location'}
        </span>
        <svg 
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Mobile: full-screen overlay */}
          <div className="md:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setIsOpen(false)} />
          <div className="
            md:absolute md:top-full md:left-0 md:mt-1 md:w-80 md:rounded-lg md:shadow-lg
            fixed bottom-0 inset-x-0 w-full z-50 md:z-50 md:w-80
            bg-white border border-gray-200 
            rounded-t-2xl md:rounded-lg shadow-xl
            max-h-[75vh] md:max-h-none
            flex flex-col
          ">
            {/* Mobile drag handle */}
            <div className="md:hidden flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Mobile header */}
            <div className="md:hidden px-4 pb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Select Location</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Search locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                autoFocus
              />
            </div>

            {/* Location List */}
            <div className="flex-1 overflow-y-auto max-h-64 md:max-h-64">
              {filteredLocations.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No locations found
                </div>
              ) : (
                filteredLocations.map((location) => (
                  <button
                    key={location.id}
                    onClick={() => {
                      onLocationChange(location.id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100 flex items-start gap-3 ${
                      location.id === selectedLocationId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${
                        location.id === selectedLocationId ? 'text-blue-600' : 'text-gray-900'
                      }`}>
                        {location.title}
                      </div>
                      {location.address && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">
                          {location.address}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        {location.averageRating && (
                          <span className="text-yellow-600">
                            ★ {location.averageRating.toFixed(1)}
                          </span>
                        )}
                        <span>{location.totalReviews} reviews</span>
                      </div>
                    </div>
                    {location.id === selectedLocationId && (
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Add New Location */}
            <div className="border-t border-gray-100 p-2">
              <Link
                href="/dashboard/add-location"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add new location
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
