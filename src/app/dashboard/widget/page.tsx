'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Location {
  id: string;
  title: string;
  gmbAccountId: string;
  gmbLocationId: string;
}

interface WidgetSettings {
  layout: string;
  theme: string;
  accentColor: string;
  showName: boolean;
  showDate: boolean;
  showBadge: boolean;
}

// Sample reviews for the preview
const SAMPLE_REVIEWS = [
  {
    id: '1',
    authorName: 'Sarah M.',
    rating: 5,
    text: 'Absolutely wonderful experience! The team was professional, friendly, and went above and beyond to help us. Highly recommend to anyone looking for top-notch service.',
    createTime: '2026-02-15T10:30:00Z',
  },
  {
    id: '2',
    authorName: 'James T.',
    rating: 4,
    text: 'Great service overall. Very responsive and easy to work with. Will definitely be coming back for future needs.',
    createTime: '2026-02-10T14:20:00Z',
  },
  {
    id: '3',
    authorName: 'Emily R.',
    rating: 5,
    text: 'Best in the business! They really care about their customers and it shows. Five stars all the way.',
    createTime: '2026-01-28T09:15:00Z',
  },
];

function getInitial(name: string): string {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ─── Live Preview Component ───────────────────────────────────────
function WidgetPreview({ settings }: { settings: WidgetSettings }) {
  const [carouselIndex, setCarouselIndex] = useState(0);

  const isDark = settings.theme === 'dark';
  const accent = settings.accentColor || '#4285F4';
  const layout = settings.layout || 'carousel';

  // Colors
  const containerBg = isDark ? '#1a1a2e' : '#EBF2FA';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#f3f4f6' : '#1f2937';
  const subText = isDark ? '#9ca3af' : '#5f6368';
  const borderColor = isDark ? '#374151' : '#e8eaed';

  // Auto-rotate carousel
  useEffect(() => {
    if (layout !== 'carousel') return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % SAMPLE_REVIEWS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [layout]);

  const StarRating = ({ rating }: { rating: number }) => (
    <div style={{ display: 'flex', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            color: i <= rating ? '#F4B400' : (isDark ? '#4b5563' : '#dadce0'),
            fontSize: '16px',
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  );

  const GoogleBadge = () => (
    <svg viewBox="0 0 48 48" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );

  const ReviewCard = ({ review, style }: { review: typeof SAMPLE_REVIEWS[0]; style?: React.CSSProperties }) => (
    <div
      style={{
        background: cardBg,
        borderRadius: '12px',
        padding: '20px',
        border: `1px solid ${borderColor}`,
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: accent,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '16px',
            flexShrink: 0,
          }}
        >
          {getInitial(review.authorName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {settings.showName && (
            <div style={{ fontWeight: 600, color: textColor, fontSize: '14px' }}>
              {review.authorName}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            <StarRating rating={review.rating} />
            {settings.showBadge && <GoogleBadge />}
          </div>
        </div>
      </div>
      <p
        style={{
          color: isDark ? '#d1d5db' : '#374151',
          fontSize: '13px',
          lineHeight: '1.5',
          margin: '0 0 8px 0',
        }}
      >
        {review.text}
      </p>
      {settings.showDate && (
        <div style={{ color: subText, fontSize: '12px' }}>{formatDate(review.createTime)}</div>
      )}
    </div>
  );

  const PoweredByFooter = () => (
    <div
      style={{
        textAlign: 'center',
        paddingTop: '12px',
        paddingBottom: '4px',
      }}
    >
      <a
        href="https://localreviewresponder.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: '10px',
          fontVariant: 'small-caps',
          letterSpacing: '0.5px',
          color: isDark ? '#6b7280' : '#9ca3af',
          textDecoration: 'none',
        }}
      >
        powered by Local Review Responder LLC
      </a>
    </div>
  );

  return (
    <div
      style={{
        background: containerBg,
        borderRadius: '12px',
        padding: '20px',
        minHeight: '200px',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Carousel Layout */}
      {layout === 'carousel' && (
        <div>
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                display: 'flex',
                transition: 'transform 0.5s ease',
                transform: `translateX(-${carouselIndex * 100}%)`,
              }}
            >
              {SAMPLE_REVIEWS.map((review) => (
                <div key={review.id} style={{ minWidth: '100%', padding: '0 4px', boxSizing: 'border-box' }}>
                  <ReviewCard review={review} />
                </div>
              ))}
            </div>
          </div>
          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
            {SAMPLE_REVIEWS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCarouselIndex(i)}
                style={{
                  width: i === carouselIndex ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: i === carouselIndex ? accent : (isDark ? '#4b5563' : '#d1d5db'),
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <PoweredByFooter />
        </div>
      )}

      {/* Grid Layout */}
      {layout === 'grid' && (
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '16px',
            }}
          >
            {SAMPLE_REVIEWS.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <PoweredByFooter />
        </div>
      )}

      {/* List Layout */}
      {layout === 'list' && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {SAMPLE_REVIEWS.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <PoweredByFooter />
        </div>
      )}
    </div>
  );
}

// ─── Main Widget Content ──────────────────────────────────────────
function WidgetContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'embed'>('design');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Widget settings
  const [settings, setSettings] = useState<WidgetSettings>({
    layout: 'carousel',
    theme: 'light',
    accentColor: '#4285F4',
    showName: true,
    showDate: true,
    showBadge: true,
  });

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  // Fetch locations
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/locations')
      .then((res) => res.json())
      .then((data) => {
        const locs = data.locations || [];
        setLocations(locs);
        if (locs.length > 0) {
          const paramId = searchParams.get('locationId');
          setSelectedLocationId(paramId && locs.find((l: Location) => l.id === paramId) ? paramId : locs[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, searchParams]);

  // Fetch widget settings when location changes
  useEffect(() => {
    if (!selectedLocationId) return;
    fetch(`/api/widget/settings?locationId=${selectedLocationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings({
            layout: data.settings.layout || 'carousel',
            theme: data.settings.theme || 'light',
            accentColor: data.settings.accentColor || '#4285F4',
            showName: data.settings.showName !== false,
            showDate: data.settings.showDate !== false,
            showBadge: data.settings.showBadge !== false,
          });
        }
      })
      .catch(() => {});
  }, [selectedLocationId]);

  // Save settings
  const saveSettings = async () => {
    if (!selectedLocationId) return;
    setSaving(true);
    try {
      await fetch('/api/widget/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: selectedLocationId, ...settings }),
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
    setSaving(false);
  };

  // Embed code
  const embedCode = selectedLocationId
    ? `<div id="lrr-widget" data-location-id="${selectedLocationId}"></div>\n<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget.js" async></script>`
    : '';

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              Customize and embed reviews on your website
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

        {/* Location info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <p className="text-sm text-gray-600">
            Location: <span className="font-semibold text-gray-900">{selectedLocation?.title || 'Select a location'}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Manage which reviews appear in the widget from the{' '}
            <a href="/dashboard/reviews" className="text-blue-600 hover:underline">Reviews</a> page.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {(['design', 'embed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'design' ? '🎨 Design' : '📋 Embed Code'}
              </button>
            ))}
          </nav>
        </div>

        {/* Design Tab */}
        {activeTab === 'design' && (
          <div className="space-y-6">
            {/* Settings + Preview side by side on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Settings Panel */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Widget Settings</h3>
                <div className="space-y-5">
                  {/* Layout */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['carousel', 'grid', 'list'].map((l) => (
                        <button
                          key={l}
                          onClick={() => setSettings({ ...settings, layout: l })}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            settings.layout === l
                              ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {l === 'carousel' ? '◀ Carousel' : l === 'grid' ? '▦ Grid' : '☰ List'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['light', 'dark'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setSettings({ ...settings, theme: t })}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            settings.theme === t
                              ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {t === 'light' ? '☀️ Light' : '🌙 Dark'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                        className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
                      />
                      <span className="text-sm text-gray-500 font-mono">{settings.accentColor}</span>
                    </div>
                  </div>

                  {/* Toggle Options */}
                  <div className="space-y-3 pt-1">
                    {[
                      { key: 'showName' as const, label: 'Show reviewer name' },
                      { key: 'showDate' as const, label: 'Show review date' },
                      { key: 'showBadge' as const, label: 'Show Google badge' },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{label}</span>
                        <button
                          onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings[key] ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings[key] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </label>
                    ))}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>

              {/* Live Preview Panel */}
              <div>
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-900">Live Preview</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      Sample data
                    </span>
                  </div>
                  <WidgetPreview settings={settings} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Embed Code Tab */}
        {activeTab === 'embed' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Embed Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Copy and paste this code into your website to display the review widget.
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
                <code>{embedCode}</code>
              </pre>
              <button
                onClick={copyEmbed}
                className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> The widget displays reviews you&apos;ve published on the{' '}
                <a href="/dashboard/reviews" className="underline">Reviews</a> page.
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
