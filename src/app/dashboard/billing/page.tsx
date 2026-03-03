'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { CreditCard, CheckCircle, Clock, AlertCircle, Download, FileText, ExternalLink } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  plan: string;
  currentPeriodEnd: string | null;
  trialEnd: string | null;
  locationTitle: string;
}

interface Invoice {
  id: string;
  number: string | null;
  date: number;
  amount: number;
  currency: string;
  status: string | null;
  pdfUrl: string | null;
  hostedUrl: string | null;
  description: string;
}

function BillingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
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

    async function fetchInvoices() {
      try {
        const res = await fetch('/api/billing/invoices');
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices || []);
        }
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
      } finally {
        setInvoicesLoading(false);
      }
    }

    fetchBilling();
    fetchInvoices();
  }, [session]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Failed to open portal:', err);
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

  const getInvoiceStatusBadge = (status: string | null) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'void':
        return 'bg-gray-100 text-gray-800';
      case 'uncollectible':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-500 mt-1">Manage your subscriptions and billing</p>
      </div>

      {/* Pricing info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              $29/month or $290/year per location — includes 14-day free trial
            </span>
          </div>
          {subscriptions.length > 0 && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="text-sm font-medium text-blue-700 hover:text-blue-800 disabled:opacity-50"
            >
              {portalLoading ? 'Opening...' : 'Manage Subscription'}
            </button>
          )}
        </div>
      </div>

      {/* Past due warning */}
      {subscriptions.some((s) => s.status === 'past_due') && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-900">
              One or more subscriptions have a past-due payment. Please update your payment method.
            </span>
          </div>
        </div>
      )}

      {/* Subscriptions */}
      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active subscriptions</h3>
          <p className="text-gray-500 mb-4">Subscribe to a location to start managing reviews.</p>
          <a
            href="/dashboard/add-location"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Add Location
          </a>
        </div>
      ) : (
        <div className="grid gap-4 mb-8">
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

      {/* Invoice History */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice History</h2>

        {invoicesLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No invoices yet. Invoices will appear here after your first payment.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Table header - hidden on mobile */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Invoice</div>
              <div className="col-span-3">Description</div>
              <div className="col-span-1 text-right">Amount</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Invoice rows */}
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 items-center"
              >
                <div className="sm:col-span-2 text-sm text-gray-900">
                  <span className="sm:hidden text-xs text-gray-500 mr-2">Date:</span>
                  {formatDate(invoice.date)}
                </div>

                <div className="sm:col-span-3 text-sm text-gray-600 font-mono">
                  <span className="sm:hidden text-xs text-gray-500 mr-2">Invoice:</span>
                  {invoice.number || '\u2014'}
                </div>

                <div className="sm:col-span-3 text-sm text-gray-600 truncate">
                  <span className="sm:hidden text-xs text-gray-500 mr-2">Description:</span>
                  {invoice.description}
                </div>

                <div className="sm:col-span-1 text-sm font-medium text-gray-900 sm:text-right">
                  <span className="sm:hidden text-xs text-gray-500 mr-2">Amount:</span>
                  {formatCurrency(invoice.amount, invoice.currency)}
                </div>

                <div className="sm:col-span-1 sm:text-center">
                  <span className="sm:hidden text-xs text-gray-500 mr-2">Status:</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getInvoiceStatusBadge(invoice.status)}`}>
                    {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Unknown'}
                  </span>
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 sm:justify-end mt-2 sm:mt-0">
                  {invoice.pdfUrl && (
                    <a
                      href={invoice.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </a>
                  )}
                  {invoice.hostedUrl && (
                    <a
                      href={invoice.hostedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                      title="View on Stripe"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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