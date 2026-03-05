/* eslint-disable react/no-unescaped-entities */
'use client';

import { signOut } from 'next-auth/react';
import { CheckCircle, LogOut, RefreshCw, ExternalLink, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import { useState } from 'react';

interface NoLocationsFoundProps {
  userEmail?: string;
  onRetry?: () => void;
}

export function NoLocationsFound({ userEmail, onRetry }: NoLocationsFoundProps) {
  const [gbpExpanded, setGbpExpanded] = useState(false);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full">

        {/* Header */}
        <div className="flex justify-center mb-5">
          <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Let's get your business connected
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Signed in as <span className="font-medium text-gray-700">{userEmail || 'your account'}</span>
          &nbsp;&mdash; but no Google Business Profile locations were found.
          <br />Follow the steps below to get set up.
        </p>

        {/* Steps */}
        <div className="space-y-4 mb-8">

          {/* Step 1 */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-start gap-4 p-4">
              <div className="flex-shrink-0 h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
                1
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">Make sure you have a Google Business Profile</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Local Review Responder connects to Google Business Profile (GBP) — Google's free tool for managing how your business appears on Google Search and Maps.
                </p>
                <button
                  onClick={() => setGbpExpanded(!gbpExpanded)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                >
                  {gbpExpanded ? 'Hide' : 'What is Google Business Profile?'}
                  {gbpExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
                {gbpExpanded && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
                    <p>
                      Google Business Profile is a free listing that lets your business show up in Google Search and Google Maps — including your reviews, hours, photos, and contact info.
                    </p>
                    <p>
                      If you've ever seen a business panel appear on the right side of Google search results, that's powered by Google Business Profile.
                    </p>
                    <p>
                      If you don't have one yet, you can create and verify your business for free at <strong>business.google.com</strong>.
                    </p>
                  </div>
                )}
                <a
                  href="https://business.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Go to Google Business Profile <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-start gap-4 p-4">
              <div className="flex-shrink-0 h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
                2
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">Sign in with the right Google account</h3>
                <p className="text-sm text-gray-600 mb-3">
                  You must sign in with the Google account that has <strong>Owner</strong> or <strong>Manager</strong> access to your Google Business Profile. This is often your business email, not a personal Gmail.
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  Currently signed in as: <span className="font-medium text-gray-700">{userEmail || '—'}</span>
                </p>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out and try a different account
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-start gap-4 p-4">
              <div className="flex-shrink-0 h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
                3
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">Already set up? Check again</h3>
                <p className="text-sm text-gray-600 mb-3">
                  If you've confirmed you have a GBP and you're signed in with the right account, click below to re-check for locations.
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Check again for locations
                  </button>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Someone else manages it */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-1">Someone else manages your GBP?</h4>
              <p className="text-sm text-amber-800">
                Ask your marketing team, web agency, or whoever manages your Google Business Profile to either
                add you as an Owner or Manager — or have them sign up for Local Review Responder directly.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
