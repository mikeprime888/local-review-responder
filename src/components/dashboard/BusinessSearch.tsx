'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Star, ChevronRight, Loader2, Building2, LogIn } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  totalRatings?: number;
}

interface BusinessSearchProps {
  hasGoogleToken: boolean;
  userEmail?: string;
}

export function BusinessSearch({ hasGoogleToken, userEmail }: BusinessSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PlaceResult | null>(null);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  // Step 2: Business selected — show next action
  if (selected) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
        <div className="max-w-lg w-full">
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <MapPin className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Great — we found your business!
          </h2>
          <p className="text-gray-500 text-center mb-6 text-sm">
            Here&#39;s what we found on Google. Now let&#39;s connect your account to start managing reviews.
          </p>

          {/* Selected business card */}
          <div className="border-2 border-green-400 bg-green-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-green-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{selected.name}</p>
                <p className="text-sm text-gray-500">{selected.address}</p>
                {selected.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-600">
                      {selected.rating} ({selected.totalRatings?.toLocaleString()} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Next action based on auth method */}
          {hasGoogleToken ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center mb-2">
                Signed in as <span className="font-medium text-gray-800">{userEmail}</span> — now add this location to your account.
              </p>
              <Link
                href="/dashboard/add-location"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add this location
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                <p className="text-sm text-blue-800">
                  To manage reviews for this business, you need to connect the Google account
                  that has <strong>Owner or Manager access</strong> to this Google Business Profile.
                </p>
              </div>
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <LogIn className="h-4 w-4" />
                Connect Google account to continue
              </button>
            </div>
          )}

          <button
            onClick={() => setSelected(null)}
            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            &#8592; Search again
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Search
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-lg w-full">
        <div className="flex justify-center mb-5">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Find your business
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Search for your business as it appears on Google Maps to get started.
        </p>

        {/* Search input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Joe's Pizza New York"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 mb-4">
            {results.map((place) => (
              <button
                key={place.placeId}
                onClick={() => setSelected(place)}
                className="w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="h-9 w-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{place.name}</p>
                  <p className="text-xs text-gray-500 truncate">{place.address}</p>
                  {place.rating && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-500">
                        {place.rating} &#40;{place.totalRatings?.toLocaleString()}&#41;
                      </span>
                    </div>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {searched && !loading && results.length === 0 && query.trim().length >= 2 && (
          <div className="text-center py-6 text-sm text-gray-500">
            <p className="mb-1">No businesses found for &#34;{query}&#34;</p>
            <p>Try a different name or add your city.</p>
          </div>
        )}

        {/* My business isn't listed */}
        {searched && results.length > 0 && (
          <p className="text-center text-xs text-gray-400">
            Don&#39;t see your business?{' '}
            <a
              href="https://business.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Add it to Google Business Profile
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
