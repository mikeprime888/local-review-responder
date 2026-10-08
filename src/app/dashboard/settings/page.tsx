'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  User,
  Shield,
  Palette,
  MapPin,
  Calendar,
  Trash2,
  Loader2,
  AlertTriangle,
  Check,
} from 'lucide-react';

interface AccountInfo {
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
  providers: string[];
  locationCount: number;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    async function fetchAccount() {
      try {
        const res = await fetch('/api/settings/account');
        if (res.ok) {
          const data = await res.json();
          setAccount(data);
        }
      } catch {
        console.error('Failed to fetch account info');
      } finally {
        setLoading(false);
      }
    }
    fetchAccount();
  }, [session]);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch('/api/settings/account', { method: 'DELETE' });
      if (res.ok) {
        await signOut({ callbackUrl: '/' });
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete account');
        setDeleting(false);
      }
    } catch {
      setError('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Account Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <User className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Account</h3>
        </div>

        <div className="flex items-start gap-4">
          {account?.image ? (
            <img
              src={account.image}
              alt={account.name || 'Profile'}
              className="w-14 h-14 rounded-full border-2 border-gray-100"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
              {(account?.name || account?.email || '?').charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">
              {account?.name || 'No name set'}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{account?.email}</p>

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {account?.locationCount || 0} location{account?.locationCount !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Member since{' '}
                {account?.createdAt
                  ? new Date(account.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Accounts / Security */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Connected accounts</h3>
        </div>

        <div className="space-y-3">
          {account?.providers?.includes('google') && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Google</p>
                <p className="text-xs text-gray-500">
                  Connected — used for sign-in and Google Business Profile access
                </p>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <Check className="h-3 w-3" />
                Active
              </span>
            </div>
          )}

          {account?.providers?.length === 0 && (
            <p className="text-sm text-gray-500">No connected accounts found.</p>
          )}

          {session?.user?.email && !account?.providers?.includes('google') && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Email & Password</p>
                <p className="text-xs text-gray-500">
                  Signed in with email and password
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Response Preferences */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
        <div className="flex items-center gap-3 mb-2">
          <Palette className="h-5 w-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">AI Response Preferences</h3>
        </div>
        <p className="text-sm text-gray-500 ml-8">
          Customize default tone, style, and templates for AI-generated review responses.
          Coming soon.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Trash2 className="h-5 w-5 text-red-500" />
          <h3 className="font-semibold text-red-700">Delete account</h3>
        </div>
        <p className="text-sm text-gray-500 ml-8 mb-4">
          Permanently delete your account and all associated data including locations, reviews, and
          widget settings. This action cannot be undone.
        </p>

        {error && (
          <div className="ml-8 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {!showDeleteConfirm ? (
          <div className="ml-8">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
            >
              Delete my account
            </button>
          </div>
        ) : (
          <div className="ml-8 p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-800 font-medium mb-3">
              Are you sure? Type <span className="font-mono font-bold">DELETE</span> to confirm.
            </p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="flex-1 max-w-[200px] px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? 'Deleting...' : 'Confirm delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                  setError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
