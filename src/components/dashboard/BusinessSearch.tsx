'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { Search, MapPin, Star, ChevronRight, Loader2, Building2, LogIn, ShieldAlert } from 'lucide-react';

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  totalRatings?: number;
}

interface BusinessSearchProps {
  hasGoogleToken: boolean;
  userEmail: string;
}

export function BusinessSearch({ hasGoogleToken, userEmail }: BusinessSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<PlaceResult | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setError(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed');
        if (data.results?.length === 0) {
          setError(`No businesses found for "${query}"`);
          setResults([]);
        } else {
          setResults(data.results || []);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, [query]);

  if (selectedBusiness) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="w-full max-w-lg">
          {/* Selected business card */}
          <div className="bg-white rounded-xl border shadow-sm p-5 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{selectedBusiness.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{selectedBusiness.address}</p>
                {selectedBusiness.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-500">{selectedBusiness.rating} ({selectedBusiness.totalRatings?.toLocaleString()} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {hasGoogleToken ? (
            <>
              {/* Access requirement notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Owner or Manager access required</p>
                  <p className="text-sm text-amber-700 mt-1">
                    To add this location, your Google account must have <strong>Owner</strong> or <strong>Manager</strong> access
                    to this business on Google Business Profile.
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Currently signed in as <strong>{userEmail}</strong>.
                    If this isn&apos;t the right account, sign out and try a different one.
                  </p>
                </div>
              </div>
              <a
                href="/dashboard/add-location"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl px-6 py-3.5 font-medium hover:bg-blue-700 transition-colors"
              >
                Continue to add location
                <ChevronRight className="w-4 h-4" />
              </a>
            </>
          ) : (
            <>
              {/* Connect Google notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 flex gap-3">
                <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Connect your Google account</p>
                  <p className="text-sm text-blue-700 mt-1">
                    You need to sign in with the Google account that has <strong>Owner</strong> or <strong>Manager</strong> access
                    to this business on Google Business Profile.
                  </p>
                </div>
              </div>
              <button
                onClick={() => signIn('google')}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl px-6 py-3.5 font-medium hover:bg-blue-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Connect Google account
              </button>
            </>
          )}

          <button
            onClick={() => setSelectedBusiness(null)}
            className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            Search for a different business
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Find your business</h1>
          <p className="text-gray-500 mt-2 text-center">
            Search for your business as it appears on Google Maps to get started.
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            {loading ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Joe's Pizza New York"
            className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {error && query.length >= 3 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            <p>{error}</p>
            <p className="mt-1">Try a different name or add your city.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {results.map((place) => (
              <button
                key={place.placeId}
                onClick={() => setSelectedBusiness(place)}
                className="w-full flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-0"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{place.name}</p>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{place.address}</p>
                  {place.rating && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-500">{place.rating} ({place.totalRatings?.toLocaleString()})</span>
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
