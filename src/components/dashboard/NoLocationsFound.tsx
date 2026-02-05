/* eslint-disable react/no-unescaped-entities */
'use client';

import { signOut } from 'next-auth/react';
import { AlertCircle, LogOut, UserPlus, HelpCircle, RefreshCw } from 'lucide-react';

interface NoLocationsFoundProps {
  userEmail?: string;
  onRetry?: () => void;
}

export function NoLocationsFound({ userEmail, onRetry }: NoLocationsFoundProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          No Google Business Locations Found
        </h2>
        
        <p className="text-gray-600 text-center mb-6">
          We couldn't find any Google Business Profile locations connected to{' '}
          <span className="font-medium text-gray-900">{userEmail || 'your account'}</span>.
        </p>

        {/* Reasons */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <HelpCircle className="h-4 w-4 mr-2 text-gray-500" />
            This could mean:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              You're signed into the wrong Google account
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              You don't have admin/owner access to your business's Google Business Profile
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              Your business hasn't been claimed on Google yet
            </li>
          </ul>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 mb-2">Your options:</h3>
          
          {/* Try different account */}
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out and try a different account
          </button>

          {/* Retry */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full flex items-center justify-center px-4 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check again for locations
            </button>
          )}
        </div>

        {/* Help text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
            <UserPlus className="h-4 w-4 mr-2" />
            Don't manage the Google account yourself?
          </h4>
          <p className="text-sm text-blue-800">
            Ask the person who manages your Google Business Profile (marketing team, agency, etc.) 
            to either add you as an admin, or have them sign up for Local Review Responder directly.
          </p>
        </div>

        {/* Link to Google Business */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Need to claim your business?{' '}
          <a 
            href="https://business.google.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Visit Google Business Profile →
          </a>
        </p>
      </div>
    </div>
  );
}
