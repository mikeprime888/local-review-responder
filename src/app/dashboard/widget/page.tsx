'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Location {
  id: string;
  title: string;
  averageRating: number;
  totalReviews: number;
}

interface Review {
  id: string;
  reviewerName: string | null;
  starRating: number;
  comment: string | null;
  googleCreatedAt: string;
  isPublished: boolean;
  publishedAt: string | null;
}

interface WidgetSettings {
  layout: string;
  theme: string;
  accentColor: string;
  maxReviews: number;
  minStars: number;
  showDate: boolean;
  showName: boolean;
  showBadge: boolean;
}

const DEFAULT_SETTINGS: WidgetSettings = {
  layout: 'carousel',
  theme: 'light',
  accentColor: '#4F46E5',
  maxReviews: 10,
  minStars: 4,
  showDate: true,
  showName: true,
  showBadge: true,
};

function WidgetContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<WidgetSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reviews' | 'design' | 'embed'>('reviews');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch('/api/subscriptions?active=true');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLocations(data.locations || []);
      if (data.locations?.length > 0 && !selectedLocationId) {
        setSelectedLocationId(data.locations[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching locations:', err);
    }
  }, [selectedLocationId]);

  const fetchReviews = useCallback(async (locationId: string) => {
    try {
      const response = await fetch('/api/google/reviews?locationId=' + locationId);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReviews(data.reviews || []);
    } catch (err: any) {
      console.error('Error fetching reviews:', err);
    }
  }, []);

  const fetchSettings = useCallback(async (locationId: string) => {
    try {
      const response = await fetch('/api/widget/' + locationId);
      const data = await response.json();
      if (data.settings) setSettings(data.settings);
    } catch {
      setSettings(DEFAULT_SETTINGS);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLocations().finally(() => setLoading(false));
    }
  }, [status, fetchLocations]);

  useEffect(() => {
    if (selectedLocationId) {
      fetchReviews(selectedLocationId);
      fetchSettings(selectedLocationId);
    }
  }, [selectedLocationId, fetchReviews, fetchSettings]);

  const togglePublish = async (reviewId: string) => {
    setTogglingId(reviewId);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/publish`, {
        method: 'PATCH',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, isPublished: data.isPublished, publishedAt: data.publishedAt }
            : r
        )
      );
    } catch (err: any) {
      console.error('Error toggling publish:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const saveSettings = async () => {
    if (!selectedLocationId) return;
    setSaving(true);
    try {
      const response = await fetch('/api/widget/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: selectedLocationId, ...settings }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
    } catch (err: any) {
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const publishedCount = reviews.filter((r) => r.isPublished).length;

  const embedCode = `<div id="lrr-reviews" data-location="${selectedLocationId || ''}"></div>
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" async></script>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Widget</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and embed reviews on your website
            </p>
          </div>
          {locations.length > 1 && (
            <select
              value={selectedLocationId || ''}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Reviews</p>
            <p className="text-2xl font-bold text-gray-900">{reviews.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Published to Widget</p>
            <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Location</p>
            <p className="text-lg font-semibold text-gray-900 truncate">
              {selectedLocation?.title || 'Select a location'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {(['reviews', 'design', 'embed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'reviews' ? 'Published Reviews' : tab === 'design' ? 'Design' : 'Embed Code'}
              </button>
            ))}
          </nav>
        </div>

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                No reviews found. Sync your reviews from the dashboard first.
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className={`bg-white rounded-lg border p-4 flex items-start justify-between ${
                    review.isPublished ? 'border-green-200 bg-green-50/30' : 'border-gray-200'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-yellow-500 text-sm">{renderStars(review.starRating)}</span>
                      <span className="text-sm text-gray-600">
                        {review.reviewerName || 'Anonymous'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(review.googleCreatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-2">
                      {review.comment || 'No comment'}
                    </p>
                  </div>
                  <button
                    onClick={() => togglePublish(review.id)}
                    disabled={togglingId === review.id}
                    className={`ml-4 flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      review.isPublished
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    } ${togglingId === review.id ? 'opacity-50' : ''}`}
                  >
                    {togglingId === review.id
                      ? '...'
                      : review.isPublished
                      ? 'Published'
                      : 'Publish'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Design Tab */}
        {activeTab === 'design' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
                <select
                  value={settings.layout}
                  onChange={(e) => setSettings({ ...settings, layout: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="carousel">Carousel</option>
                  <option value="grid">Grid</option>
                  <option value="list">List</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">{settings.accentColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Stars
                </label>
                <select
                  value={settings.minStars}
                  onChange={(e) => setSettings({ ...settings, minStars: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}+ Stars
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Reviews Shown
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={settings.maxReviews}
                  onChange={(e) =>
                    setSettings({ ...settings, maxReviews: parseInt(e.target.value) || 10 })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.showName}
                    onChange={(e) => setSettings({ ...settings, showName: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Show reviewer name</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.showDate}
                    onChange={(e) => setSettings({ ...settings, showDate: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Show review date</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={settings.showBadge}
                    onChange={(e) => setSettings({ ...settings, showBadge: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Show &quot;Powered by&quot; badge</span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}

        {/* Embed Tab */}
        {activeTab === 'embed' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Embed Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Copy this code and paste it into your website where you want the reviews to appear.
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                {embedCode}
              </pre>
              <button
                onClick={copyEmbed}
                className="absolute top-2 right-2 px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> The widget will only display reviews you have published.
                Currently {publishedCount} review{publishedCount !== 1 ? 's' : ''} will appear.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WidgetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <WidgetContent />
    </Suspense>
  );
}
