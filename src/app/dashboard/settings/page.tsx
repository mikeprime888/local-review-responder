'use client';

import { User, Shield, Palette } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Account</h3>
          </div>
          <p className="text-sm text-gray-500 ml-8">
            Profile information, email preferences, and account management. Coming soon.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Security</h3>
          </div>
          <p className="text-sm text-gray-500 ml-8">
            Connected accounts, authentication methods, and security settings. Coming soon.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">AI Response Preferences</h3>
          </div>
          <p className="text-sm text-gray-500 ml-8">
            Customize tone, style, and templates for AI-generated review responses. Coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
