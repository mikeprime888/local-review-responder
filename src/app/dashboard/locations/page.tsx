'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, ExternalLink, Star, RefreshCw } from 'lucide-react';

interface Location {
  id: string;
  title: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  mapsUri: string | null;
  averageRating: number | null;
  totalReviews: number;
  isActive: boolean;
  lastSyncedAt: string | null;
  subscription: {
    status: string;
    trialEnd: string | null;
  } | null;
}

function LocationsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    async function fetchLocations() {
      try {
        const res = await fetch('/api/google/locations');
        if (res.ok) {
          const data = await res.json();
          setLocations(data.locations || []);
        }
      } catch (err) {
        console.error('Failed to fetch locations:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-500 mt-1">Manage your Google Business Profile locations</p>
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-500">Connect your Google Business Profile to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{location.title}</h3>
                    {location.subscription ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        location.subscription.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : location.subscription.status === 'trialing'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {location.subscription.status === 'trialing' ? 'Trial' : location.subscription.status}
                      </span>
                    ) : (
                      <Link
                        href="/dashboard/add-location"
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
                      >
                        Subscribe →
                      </Link>
                    )}
                  </div>

                  {location.address && (
                    <p className="text-sm text-gray-500 mt-1">{location.address}</p>
                  )}

                  <div className="flex items-center gap-6 mt-3">
                    {location.averageRating != null && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {location.averageRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-gray-500">
                      {location.totalReviews} reviews
                    </span>
                    {location.phone && (
                      <span className="text-sm text-gray-500">{location.phone}</span>
                    )}
                    {location.lastSyncedAt && (
                      <div className="flex items-center gap-1 text-sm text-gray-400">
                        <RefreshCw className="h-3 w-3" />
                        Last synced {new Date(location.lastSyncedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {location.mapsUri && (
                    <a
                      href={location.mapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View on Google
                    </a>
                  )}
                  {location.website && (
                    <a
                      href={location.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LocationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LocationsContent />
    </Suspense>
  );
}