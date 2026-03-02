'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Mail, Star, BarChart3, Check, Loader2 } from 'lucide-react';

interface NotificationPrefs {
  notifyNewReviews: boolean;
  notifyLowRated: boolean;
  notifyWeeklyDigest: boolean;
  email: string | null;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    async function fetchPrefs() {
      try {
        const res = await fetch('/api/settings/notifications');
        if (res.ok) {
          const data = await res.json();
          setPrefs(data);
        } else {
          setError('Failed to load notification preferences');
        }
      } catch {
        setError('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    }
    fetchPrefs();
  }, [session]);

  const togglePref = async (field: keyof NotificationPrefs) => {
    if (!prefs || field === 'email') return;

    const newValue = !prefs[field];
    const previousPrefs = { ...prefs };

    // Optimistic update
    setPrefs({ ...prefs, [field]: newValue });
    setSaving(field);
    setSaved(null);
    setError(null);

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue }),
      });

      if (res.ok) {
        setSaved(field);
        setTimeout(() => setSaved(null), 2000);
      } else {
        // Revert on failure
        setPrefs(previousPrefs);
        setError('Failed to save preference');
      }
    } catch {
      setPrefs(previousPrefs);
      setError('Failed to save preference');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const notificationOptions = [
    {
      key: 'notifyNewReviews' as const,
      icon: Bell,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      title: 'New review alerts',
      description:
        'Get notified when customers leave new reviews on any of your subscribed locations. Emails are sent during the nightly sync (2 AM EST).',
    },
    {
      key: 'notifyLowRated' as const,
      icon: Star,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
      title: 'Low-rated review alerts',
      description:
        'Receive a highlighted alert when a review of 3 stars or below is detected so you can respond quickly.',
    },
    {
      key: 'notifyWeeklyDigest' as const,
      icon: BarChart3,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      title: 'Weekly digest',
      description:
        'A summary of your review activity for the week — total new reviews, average rating, and unreplied count. Sent every Monday morning.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-500 mt-1">
          Choose which email notifications you&apos;d like to receive
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Delivery info */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">Delivery address</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Notifications are sent to{' '}
              <span className="font-medium text-gray-700">{prefs?.email || session?.user?.email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Notification toggles */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {notificationOptions.map((opt) => {
          const Icon = opt.icon;
          const isEnabled = prefs?.[opt.key] ?? false;
          const isSaving = saving === opt.key;
          const justSaved = saved === opt.key;

          return (
            <div
              key={opt.key}
              className="p-5 flex items-start gap-4"
            >
              <div className={`p-2 rounded-lg ${opt.iconBg} mt-0.5`}>
                <Icon className={`h-5 w-5 ${opt.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{opt.title}</h3>
                  {justSaved && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <Check className="h-3 w-3" />
                      Saved
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {opt.description}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                onClick={() => togglePref(opt.key)}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                } ${isSaving ? 'opacity-60' : ''}`}
              >
                <span className="sr-only">Toggle {opt.title}</span>
                <span
                  className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  {isSaving && (
                    <Loader2 className="h-3 w-3 text-gray-400 animate-spin" />
                  )}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Info footer */}
      <p className="text-xs text-gray-400 mt-4 text-center">
        Review sync runs nightly at 2 AM EST. Notification emails are sent when new reviews are detected.
      </p>
    </div>
  );
}
