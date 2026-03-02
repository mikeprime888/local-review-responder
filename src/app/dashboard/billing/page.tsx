'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CreditCard, CheckCircle, Clock, AlertCircle, ExternalLink, Plus, Loader2 } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  plan: string;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  locationTitle: string;
  cancelAtPeriodEnd?: boolean;
}

function BillingContent() {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    async function fetchBilling() {
      try {
        const res = await fetch('/api/subscriptions');
        if (res.ok) {
          const data = await res.json();
          setSubscriptions(data.subscriptions || []);
        }
      } catch (err) {
        console.error('Failed to fetch billing:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, [session]);

  const openStripePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to open billing portal');
      }
    } catch {
      alert('Failed to open billing portal. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'trialing':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'past_due':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trialing':
        return 'bg-blue-100 text-blue-800';
      case 'past_due':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string, cancelAtPeriodEnd?: boolean) => {
    if (cancelAtPeriodEnd) return 'Canceling';
    switch (status) {
      case 'trialing':
        return 'Free Trial';
      case 'past_due':
        return 'Past Due';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const hasActiveSubscriptions = subscriptions.some((s) =>
    ['active', 'trialing', 'past_due'].includes(s.status)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-500 mt-1">Manage your subscriptions and billing</p>
        </div>
        {hasActiveSubscriptions && (
          <button
            onClick={openStripePortal}
            disabled={portalLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-60 shrink-0"
          >
            {portalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Manage Subscription
          </button>
        )}
      </div>

      {/* Pricing info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <CreditCard className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="text-sm text-blue-900">
            <span className="font-medium">$29/month or $290/year per location</span>
            <span className="text-blue-700"> — includes 14-day free trial. Cancel anytime.</span>
          </div>
        </div>
      </div>

      {/* Past due warning */}
      {subscriptions.some((s) => s.status === 'past_due') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div className="text-sm text-red-800">
              <span className="font-medium">Payment failed.</span> Please update your payment method to keep your locations active.
              <button
                onClick={openStripePortal}
                className="ml-1 underline font-medium hover:text-red-900"
              >
                Update payment →
              </button>
            </div>
          </div>
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active subscriptions</h3>
          <p className="text-gray-500 mb-6">
            Subscribe to a location to start managing reviews.
          </p>
          <a
            href="/dashboard/locations"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            Add a Location
          </a>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-lg border border-gray-200 p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(sub.status)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{sub.locationTitle}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {sub.plan === 'yearly' ? '$290/year' : '$29/month'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-8 sm:ml-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        sub.cancelAtPeriodEnd ? 'canceled' : sub.status
                      )}`}
                    >
                      {getStatusLabel(sub.status, sub.cancelAtPeriodEnd)}
                    </span>
                    {sub.trialEnd && sub.status === 'trialing' && (
                      <span className="text-sm text-gray-500">
                        Trial ends {new Date(sub.trialEnd).toLocaleDateString()}
                      </span>
                    )}
                    {sub.currentPeriodEnd && sub.status === 'active' && (
                      <span className="text-sm text-gray-500">
                        {sub.cancelAtPeriodEnd ? 'Ends' : 'Renews'}{' '}
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Manage link footer */}
          <div className="mt-4 text-center">
            <button
              onClick={openStripePortal}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Update payment method, view invoices, or cancel →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
