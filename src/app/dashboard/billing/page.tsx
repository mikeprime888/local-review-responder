'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  plan: string;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  locationTitle: string;
}

function BillingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

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
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscriptions and billing</p>
      </div>

      {/* Pricing info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            $29/month or $290/year per location — includes 14-day free trial
          </span>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active subscriptions</h3>
          <p className="text-gray-500">Subscribe to a location to start managing reviews.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-lg border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(sub.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{sub.locationTitle}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {sub.plan === 'yearly' ? '$290/year' : '$29/month'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(sub.status)}`}>
                    {sub.status === 'trialing' ? 'Free Trial' : sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                  </span>
                  {sub.trialEnd && sub.status === 'trialing' && (
                    <span className="text-sm text-gray-500">
                      Trial ends {new Date(sub.trialEnd).toLocaleDateString()}
                    </span>
                  )}
                  {sub.currentPeriodEnd && sub.status === 'active' && (
                    <span className="text-sm text-gray-500">
                      Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </span>
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
