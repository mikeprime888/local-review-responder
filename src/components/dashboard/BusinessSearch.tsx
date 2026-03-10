'use client';

import { useState } from 'react';
import {
  LogIn, CheckCircle2,
  MessageSquare, Bell, Globe, ArrowRight,
  ChevronDown, ChevronUp
} from 'lucide-react';

interface BusinessSearchProps {
  hasGoogleToken: boolean;
  userEmail: string;
}

function ProgressSteps({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {[
        { n: 1, label: 'Connect Google' },
        { n: 2, label: 'Choose location' },
        { n: 3, label: 'Start trial' },
      ].map(({ n, label }, i, arr) => (
        <div key={n} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              n < step
                ? 'bg-green-500 text-white shadow-md shadow-green-200'
                : n === step
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-100'
                : 'bg-gray-100 text-gray-400'
            }`}>
              {n < step ? <CheckCircle2 className="w-4 h-4" /> : n}
            </div>
            <span className={`text-xs font-medium whitespace-nowrap ${
              n === step ? 'text-blue-600' : n < step ? 'text-green-600' : 'text-gray-400'
            }`}>{label}</span>
          </div>
          {i < arr.length - 1 && (
            <div className={`w-14 h-px mx-2 mb-5 transition-colors duration-300 ${n < step ? 'bg-green-300' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function BusinessSearch({ hasGoogleToken, userEmail }: BusinessSearchProps) {
  const [gbpExpanded, setGbpExpanded] = useState(false);

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <ProgressSteps step={hasGoogleToken ? 2 : 1} />

      {/* Feature preview banner */}
      <div className="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-blue-600 to-blue-800 p-5 text-white">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white opacity-5" />
        <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white opacity-5" />
        <p className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-3">What you unlock today</p>
        <div className="grid grid-cols-3 gap-3 relative z-10">
          {[
            { icon: MessageSquare, title: 'AI Replies', desc: 'Respond to reviews in seconds' },
            { icon: Bell, title: 'Alerts', desc: 'Notified of every new review' },
            { icon: Globe, title: 'Widget', desc: 'Showcase reviews on your site' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
              <Icon className="w-5 h-5 text-blue-200 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-white">{title}</p>
              <p className="text-xs text-blue-200 leading-tight mt-0.5 hidden sm:block">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requirements card */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Before you start</p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Google Business Profile listing</p>
              <p className="text-xs text-gray-500 mt-0.5">
                No profile yet?{' '}
                <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Create one free &rarr;
                </a>
              </p>
              <button
                onClick={() => setGbpExpanded(!gbpExpanded)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium mt-1"
              >
                {gbpExpanded ? 'Hide' : 'What is Google Business Profile?'}
                {gbpExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {gbpExpanded && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-1.5">
                  <p>
                    Google Business Profile is a free listing that lets your business show up in Google Search and Google Maps — including your reviews, hours, photos, and contact info.
                  </p>
                  <p>
                    If you&apos;ve ever seen a business panel on the right side of Google search results, that&apos;s powered by Google Business Profile.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Owner or Manager access on that profile</p>
              <p className="text-xs text-gray-500 mt-0.5">Required to sync and manage your reviews</p>
            </div>
          </div>
          <div className="border-t border-gray-100" />
          <div className="flex items-start gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${hasGoogleToken ? 'bg-green-100' : 'bg-gray-100'}`}>
              {hasGoogleToken
                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                : <div className="w-2 h-2 rounded-full bg-gray-300" />
              }
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                Google account connected
                {hasGoogleToken && <span className="ml-1.5 text-xs font-normal text-green-600">&bull; {userEmail}</span>}
              </p>
              {!hasGoogleToken && (
                <p className="text-xs text-gray-500 mt-0.5">Connect below to get started</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trial info */}
      <p className="text-xs text-gray-400 text-center mb-5">
        Start with a 14-day free trial — no charge today.
      </p>

      {/* CTA */}
      {hasGoogleToken ? (
        <a
          href="/dashboard/add-location"
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3.5 font-semibold transition-colors shadow-sm shadow-blue-200"
        >
          Continue to add location <ArrowRight className="w-4 h-4" />
        </a>
      ) : (
        <button
          onClick={() => {
            window.location.href = '/api/auth/link-google';
          }}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3.5 font-semibold transition-colors shadow-sm shadow-blue-200"
        >
          <LogIn className="w-4 h-4" /> Connect Google account
        </button>
      )}
    </div>
  );
}
