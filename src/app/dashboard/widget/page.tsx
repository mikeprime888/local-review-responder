'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface WidgetSettings {
  layout: 'list' | 'grid' | 'carousel';
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  maxReviews: number;
  minStars: number;
  autoPublish: boolean;
  autoPublishStars: number;
  showDate: boolean;
  showReviewerName: boolean;
  showReviewerPhoto: boolean;
  showRating: boolean;
  showReply: boolean;
  showSummary: boolean;
  showBadge: boolean;
  showReviewLink: boolean;
  googleReviewUrl: string | null;
}

export default function WidgetSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [locationId, setLocationId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [settings, setSettings] = useState<WidgetSettings>({
    layout: 'list',
    theme: 'light',
    accentColor: '#3B82F6',
    maxReviews: 10,
    minStars: 1,
    autoPublish: false,
    autoPublishStars: 4,
    showDate: true,
    showReviewerName: true,
    showReviewerPhoto: true,
    showRating: true,
    showReply: false,
    showSummary: true,
    showBadge: true,
    showReviewLink: false,
    googleReviewUrl: null,
  });
  const [embedCode, setEmbedCode] = useState('');
  const [iframeCode, setIframeCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<'embed' | 'iframe' | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Get current location from localStorage or URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLocationId = localStorage.getItem('currentLocationId');
      if (storedLocationId) {
        setLocationId(storedLocationId);
      }
    }
  }, []);

  // Fetch settings
  useEffect(() => {
    if (!locationId) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/widget-settings/${locationId}`);
        if (!res.ok) throw new Error('Failed to fetch settings');
        
        const data = await res.json();
        setSettings(data.settings);
        setEmbedCode(data.embedCode);
        setIframeCode(data.iframeCode);
        setBusinessName(data.businessName);
      } catch (err) {
        setError('Failed to load widget settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [locationId]);

  const handleSave = async () => {
    if (!locationId) return;
    
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/widget-settings/${locationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (code: string, type: 'embed' | 'iframe') => {
    await navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!locationId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">Please select a location first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Review Widget</h1>
        <p className="text-gray-600 mt-1">
          Configure how reviews appear on your website for {businessName}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Embed Code Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Embed Code</h2>
        <p className="text-gray-600 text-sm mb-4">
          Copy this code and paste it into your website where you want reviews to appear.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JavaScript Embed (Recommended)
            </label>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {embedCode}
              </pre>
              <button
                onClick={() => copyToClipboard(embedCode, 'embed')}
                className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                {copied === 'embed' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              iFrame Embed (Alternative)
            </label>
            <div className="relative">
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                {iframeCode}
              </pre>
              <button
                onClick={() => copyToClipboard(iframeCode, 'iframe')}
                className="absolute top-2 right-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                {copied === 'iframe' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-6">Display Settings</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Layout */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layout
            </label>
            <select
              value={settings.layout}
              onChange={(e) => setSettings({ ...settings, layout: e.target.value as 'list' | 'grid' | 'carousel' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="list">List</option>
              <option value="grid">Grid</option>
              <option value="carousel">Carousel</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'auto' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (Match System)</option>
            </select>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={settings.accentColor}
                onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="#3B82F6"
              />
            </div>
          </div>

          {/* Max Reviews */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Reviews to Display
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={settings.maxReviews}
              onChange={(e) => setSettings({ ...settings, maxReviews: parseInt(e.target.value) || 10 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Min Stars */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Star Rating
            </label>
            <select
              value={settings.minStars}
              onChange={(e) => setSettings({ ...settings, minStars: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">1+ stars (Show all)</option>
              <option value="2">2+ stars</option>
              <option value="3">3+ stars</option>
              <option value="4">4+ stars</option>
              <option value="5">5 stars only</option>
            </select>
          </div>

          {/* Google Review URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Google Review Link (Optional)
            </label>
            <input
              type="url"
              value={settings.googleReviewUrl || ''}
              onChange={(e) => setSettings({ ...settings, googleReviewUrl: e.target.value || null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://g.page/r/..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Direct link for customers to leave a review
            </p>
          </div>
        </div>

        {/* Auto Publish Section */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-gray-900">Auto-Publish Reviews</h3>
              <p className="text-sm text-gray-600">
                Automatically publish new reviews that meet your criteria
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoPublish}
                onChange={(e) => setSettings({ ...settings, autoPublish: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {settings.autoPublish && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-publish reviews with rating
              </label>
              <select
                value={settings.autoPublishStars}
                onChange={(e) => setSettings({ ...settings, autoPublishStars: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="3">3+ stars</option>
                <option value="4">4+ stars</option>
                <option value="5">5 stars only</option>
              </select>
            </div>
          )}
        </div>

        {/* Display Options */}
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-4">Display Options</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { key: 'showSummary', label: 'Show Summary Bar' },
              { key: 'showRating', label: 'Show Star Rating' },
              { key: 'showDate', label: 'Show Review Date' },
              { key: 'showReviewerName', label: 'Show Reviewer Name' },
              { key: 'showReviewerPhoto', label: 'Show Reviewer Photo' },
              { key: 'showReply', label: 'Show Your Replies' },
              { key: 'showReviewLink', label: 'Show "Leave a Review" Button' },
              { key: 'showBadge', label: 'Show Powered By Badge' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings[key as keyof WidgetSettings] as boolean}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Preview Section */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Preview</h2>
        <p className="text-gray-600 text-sm mb-4">
          This is how your widget will appear on your website. Publish some reviews to see them here.
        </p>
        <div 
          className={`p-6 rounded-lg ${settings.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}
          style={{ minHeight: '200px' }}
        >
          <div id="lrr-reviews" data-location={locationId}></div>
          <script src="/widget.js" async></script>
        </div>
      </div>
    </div>
  );
}
