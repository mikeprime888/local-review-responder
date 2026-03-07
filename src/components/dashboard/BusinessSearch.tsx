'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search, MapPin, Star, ChevronRight, Loader2,
  Building2, LogIn, AlertTriangle, CheckCircle2,
  MessageSquare, Bell, Globe, ArrowRight
} from 'lucide-react';

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

function ProgressSteps({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {[
        { n: 1, label: 'Find business' },
        { n: 2, label: 'Confirm access' },
        { n: 3, label: 'Start trial' },
      ].map(({ n, label }, i, arr) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              n < step
                ? 'bg-green-500 text-white shadow-md shadow-green-200'
                : n === step
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-100'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {n < step ? <CheckCircle2 className="w-4 h-4" /> : n}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${
              n === step ? 'text-blue-600' : n < step ? 'text-green-600' : 'text-gray-400'
            }`}>{label}</span>
          </div>
          {i < arr.length - 1 && (
            <div className={`w-14 h-px mx-2 mb-5 transition-colors duration-300 ${n < step ? 'bg-green-300' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function BusinessSearch({ hasGoogleToken, userEmail }: BusinessSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<PlaceResult | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Restore selected business from sessionStorage after Google OAuth redirect
  // Note: we do NOT clear sessionStorage here — we clear it only when the user
  // intentionally moves forward or resets, so it survives the session reload.
  useEffect(() => {
    const pending = sessionStorage.getItem('pendingBusiness');
    if (pending) {
      try {
        const business = JSON.parse(pending);
        setSelectedBusiness(business);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (query.length < 3) { setResults([]); setError(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Search failed');
        if (!data.results?.length) { setError(`No results for "${query}"`); setResults([]); }
        else setResults(data.results);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setResults([]);
      } finally { setLoading(false); }
    }, 400);
  }, [query]);

  // Step 2
  if (selectedBusiness) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8">
        <ProgressSteps step={2} />

        {/* Selected location pill */}
        <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{selectedBusiness.name}</p>
            <p className="text-sm text-gray-500 truncate">{selectedBusiness.address}</p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('pendingBusiness');
              setSelectedBusiness(null);
            }}
            className="text-xs text-blue-500 hover:text-blue-700 font-medium flex-shrink-0">
            Change
          </button>
        </div>

        {hasGoogleToken ? (
          <>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-5 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-900">Owner or Manager access required</p>
                <p className="text-sm text-amber-700">
                  The Google account you connect must have <strong>Owner</strong> or <strong>Manager</strong> access to this business on Google Business Profile.
                </p>

              </div>
            </div>
            <a
              href="/dashboard/add-location"
              onClick={() => sessionStorage.removeItem('pendingBusiness')}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3.5 font-semibold transition-colors shadow-sm shadow-blue-200">
              Continue to add location <ArrowRight className="w-4 h-4" />
            </a>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 mb-5 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-blue-900">Connect your Google account</p>
                <p className="text-sm text-blue-700">
                  Sign in with the Google account that has <strong>Owner</strong> or <strong>Manager</strong> access to this business on Google Business Profile.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                sessionStorage.setItem('pendingBusiness', JSON.stringify({
                  placeId: selectedBusiness!.placeId,
                  name: selectedBusiness!.name,
                  address: selectedBusiness!.address,
                }));
                window.location.href = '/api/auth/link-google';
              }}
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3.5 font-semibold transition-colors shadow-sm shadow-blue-200">
              <LogIn className="w-4 h-4" /> Connect Google account
            </button>
          </>
        )}

        <button
          onClick={() => {
            sessionStorage.removeItem('pendingBusiness');
            setSelectedBusiness(null);
          }}
          className="w-full mt-3 py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          &larr; Search for a different business
        </button>
      </div>
    );
  }

  // Step 1
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <ProgressSteps step={1} />

      {/* Feature preview banner */}
      <div className="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white opacity-5" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white opacity-5" />
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-3">What you unlock today</p>
        <div className="grid grid-cols-3 gap-3 relative z-10">
          {[
            { icon: MessageSquare, title: 'AI Replies', desc: 'Respond to reviews in seconds' },
            { icon: Bell, title: 'Alerts', desc: 'Notified of every new review' },
            { icon: Globe, title: 'Widget', desc: 'Showcase reviews on your site' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
              <Icon className="w-5 h-5 text-blue-200 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-white">{title}</p>
              <p className="text-xs text-blue-200 leading-tight mt-0.5 hidden sm:block">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Before you start</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Google Business Profile listing</p>
              <p className="text-xs text-gray-500 mt-0.5">
                No profile yet?{' '}
                <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Create one free &rarr;
                </a>
              </p>
            </div>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Owner or Manager access on that profile</p>
              <p className="text-xs text-gray-500 mt-0.5">Required to sync and manage your reviews</p>
            </div>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${hasGoogleToken ? 'bg-green-100' : 'bg-gray-100'}`}>
              {hasGoogleToken
                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                : <div className="w-2 h-2 rounded-full bg-gray-300" />
              }
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                Google account connected
                {hasGoogleToken && <span className="ml-1.5 text-xs font-normal text-green-600">&bull; {userEmail}</span>}
              </p>
              {!hasGoogleToken && (
                <p className="text-xs text-gray-500 mt-0.5">You&apos;ll connect it when you select your business below</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Search for your business
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            {loading
              ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              : <Search className="w-4 h-4 text-gray-400" />
            }
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. Joe's Pizza Chicago"
            autoFocus
            className="w-full pl-11 pr-4 py-3.5 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors bg-white"
          />
        </div>
        <p className="text-xs text-gray-400 mt-1.5 pl-1">Search exactly as it appears on Google Maps</p>
      </div>

      {error && query.length >= 3 && (
        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3 text-center">
          <p className="text-sm text-gray-600">{error}</p>
          <p className="text-xs text-gray-400 mt-1">Try adding your city or state</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-3 rounded-xl border-2 border-gray-200 overflow-hidden bg-white shadow-md">
          {results.map((place, i) => (
            <button
              key={place.placeId}
              onClick={() => setSelectedBusiness(place)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-blue-50 transition-colors text-left group ${i > 0 ? 'border-t border-gray-100' : ''}`}
            >
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate text-sm">{place.name}</p>
                <p className="text-xs text-gray-500 truncate mt-0.5">{place.address}</p>
                {place.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-gray-500">{place.rating} &bull; {place.totalRatings?.toLocaleString()} reviews</span>
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
