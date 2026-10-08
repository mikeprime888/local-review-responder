'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function LoginContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isDeleted = searchParams.get('deleted') === 'true';
  const isAccessDenied = searchParams.get('error') === 'AccessDenied';

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="flex items-center space-x-2 mb-8">
        <img src="/logo.svg" alt="Local Review Responder" className="h-10 w-10" />
        <span className="text-2xl font-bold text-gray-900">Local Review Responder</span>
      </div>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to manage your Google reviews</p>
        </div>

        {isDeleted && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            Your account and all associated data have been permanently deleted. We&apos;re sorry to see you go.
          </div>
        )}

        {isAccessDenied && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            This account isn&apos;t authorized to access Local Review Responder.
          </div>
        )}

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700"></div>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          <span>{isGoogleLoading ? 'Signing in...' : 'Continue with Google'}</span>
        </button>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>By signing in, you agree to our{' '}
            <a href="https://localreviewresponder.com/terms-service" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="https://localreviewresponder.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
