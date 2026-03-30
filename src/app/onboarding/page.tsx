'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, LockKeyhole, MapPin, Gift, Mail, ArrowRight } from 'lucide-react';

// ─── Scenario type ────────────────────────────────────────────────────────────
type Scenario = 'gbp-owner' | 'no-access' | 'no-gbp';

// ─── Reminder button hook ─────────────────────────────────────────────────────
function useReminder(email: string | null | undefined) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (sent || sending) return;
    setSending(true);
    try {
      await fetch('/api/reminder', { method: 'POST' });
      setSent(true);
    } catch {
      // silently fail
    }
    setSending(false);
  };

  return { sent, sending, send, email: email || '' };
}

// ─── No-locations fallback (preserved) ────────────────────────────────────────
function NoLocationsFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div
        className="w-full max-w-2xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', borderRadius: 20, border: '1px solid #ece7df' }}
      >
        {/* Header */}
        <div className="relative text-center" style={{ padding: '24px 32px', borderBottom: '1px solid #ece7df' }}>
          <a href="https://localreviewresponder.com" target="_blank" rel="noopener noreferrer">
            <img src="/lrr-email-logo.png" alt="Local Review Responder" width={400} className="mx-auto" style={{ height: 'auto' }} />
          </a>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>Smarter review management for local businesses</p>
        </div>

        <div style={{ padding: '28px 32px 32px' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#fdf7ec' }}>
            <MapPin size={28} color="#9a5616" />
          </div>
          <h2 className="text-xl font-bold text-center mb-2" style={{ color: '#0f172a' }}>No Business Locations Found</h2>
          <p className="text-center mb-6" style={{ fontSize: 15, color: '#64748b' }}>
            We connected your Google account but couldn&apos;t find any Google Business Profile
            locations. Make sure you have Owner or Manager access on a Google Business Profile.
          </p>
          <div className="space-y-3">
            <a
              href="/api/auth/link-google"
              className="flex items-center justify-center gap-2 w-full text-white font-bold transition-colors"
              style={{ backgroundColor: '#145da0', borderRadius: 12, padding: 16, fontSize: 16 }}
            >
              Try a Different Google Account
            </a>
            <a
              href="mailto:support@localreviewresponder.com"
              className="flex items-center justify-center gap-2 w-full font-medium transition-colors"
              style={{ backgroundColor: '#ffffff', border: '1px solid #ece7df', borderRadius: 12, padding: 16, fontSize: 15, color: '#64748b' }}
            >
              Contact Support
            </a>
            <a
              href="/dashboard?setup=skipped"
              className="block text-center mt-2 underline"
              style={{ fontSize: 13, color: '#94a3b8' }}
            >
              Skip for now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Progress section ─────────────────────────────────────────────────────────
function ProgressSection() {
  return (
    <div className="text-center" style={{ padding: '16px 32px 0' }}>
      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
        Connect Google &nbsp;→&nbsp; Choose location &nbsp;→&nbsp; Start trial
      </p>
    </div>
  );
}

// ─── Scenario option config ───────────────────────────────────────────────────
const scenarios: {
  key: Scenario;
  value: string;
  icon: typeof CheckCircle2;
  title: string;
  sub: string;
  selectedBg: string;
  borderColor: string;
  iconColor: string;
  titleColor: string;
}[] = [
  {
    key: 'gbp-owner',
    value: 'gbp-owner',
    icon: CheckCircle2,
    title: 'I have a GBP and I manage it',
    sub: 'I have Owner or Manager access and I\'m ready to connect',
    selectedBg: '#eef8f1',
    borderColor: '#1d6b3b',
    iconColor: '#1d6b3b',
    titleColor: '#1d6b3b',
  },
  {
    key: 'no-access',
    value: 'no-access',
    icon: LockKeyhole,
    title: 'I have a GBP but I can\'t access it',
    sub: 'Someone else owns the profile and I don\'t have Manager access yet',
    selectedBg: '#fdf7ec',
    borderColor: '#e8c77a',
    iconColor: '#9a5616',
    titleColor: '#9a5616',
  },
  {
    key: 'no-gbp',
    value: 'no-gbp',
    icon: MapPin,
    title: 'I don\'t have a Google Business Profile yet',
    sub: 'My business isn\'t listed on Google Maps yet',
    selectedBg: '#eef5fe',
    borderColor: '#a9c9f1',
    iconColor: '#135d9c',
    titleColor: '#135d9c',
  },
];

// ─── Contextual hint ──────────────────────────────────────────────────────────
function ContextualHint({ scenario, reminder }: { scenario: Scenario; reminder: ReturnType<typeof useReminder> }) {
  if (scenario === 'gbp-owner') {
    return (
      <div style={{ backgroundColor: '#eef8f1', border: '1px solid #a7dbba', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#1d6b3b', margin: 0, lineHeight: '21px' }}>
          You&apos;re all set — click below to connect your Google account and start syncing your reviews.
        </p>
      </div>
    );
  }

  if (scenario === 'no-access') {
    return (
      <div style={{ backgroundColor: '#fdf7ec', border: '1px solid #e8c77a', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: '#9a5616', margin: 0, lineHeight: '21px' }}>
          You&apos;ll need the profile Owner to add you at{' '}
          <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: '#9a5616' }}>
            business.google.com
          </a>{' '}
          → Manage → Users. Once added as Owner or Manager, come back and connect.
        </p>
        {reminder.sent ? (
          <p className="mt-2" style={{ fontSize: 13, color: '#9a5616', margin: '8px 0 0' }}>
            ✓ Reminder sent to {reminder.email}
          </p>
        ) : (
          <button
            onClick={reminder.send}
            disabled={reminder.sending}
            className="inline-flex items-center gap-2 mt-2 underline font-medium cursor-pointer bg-transparent border-none p-0"
            style={{ fontSize: 13, color: '#9a5616' }}
          >
            <Mail size={14} /> {reminder.sending ? 'Sending...' : 'Email me a reminder to come back'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#eef5fe', border: '1px solid #a9c9f1', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
      <p style={{ fontSize: 13, color: '#135d9c', margin: 0, lineHeight: '21px' }}>
        Create your free profile at{' '}
        <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: '#135d9c' }}>
          business.google.com
        </a>
        . Google typically verifies new profiles within a few days — come back once confirmed.
      </p>
      {reminder.sent ? (
        <p className="mt-2" style={{ fontSize: 13, color: '#135d9c', margin: '8px 0 0' }}>
          ✓ Reminder sent to {reminder.email}
        </p>
      ) : (
        <button
          onClick={reminder.send}
          disabled={reminder.sending}
          className="inline-flex items-center gap-2 mt-2 underline font-medium cursor-pointer bg-transparent border-none p-0"
          style={{ fontSize: 13, color: '#135d9c' }}
        >
          <Mail size={14} /> {reminder.sending ? 'Sending...' : 'Email me a reminder to come back'}
        </button>
      )}
    </div>
  );
}

// ─── Off-ramp section ─────────────────────────────────────────────────────────
function OffRamp({ reminder }: { reminder: ReturnType<typeof useReminder> }) {
  return (
    <div
      id="off-ramp"
      className="w-full max-w-2xl mx-auto"
      style={{ marginTop: 24, backgroundColor: '#ffffff', borderRadius: 20, border: '1px solid #ece7df', padding: '24px 32px' }}
    >
      <h2 className="font-bold" style={{ fontSize: 16, color: '#0f172a', marginBottom: 4 }}>
        Not ready to connect yet?
      </h2>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
        No problem — use one of the options below and come back when you&apos;re ready.
      </p>

      {reminder.sent ? (
        <div className="text-center" style={{ padding: '13px 0', marginBottom: 12 }}>
          <p className="font-bold" style={{ fontSize: 14, color: '#1d6b3b' }}>
            ✓ Reminder sent to {reminder.email}
          </p>
        </div>
      ) : (
        <button
          onClick={reminder.send}
          disabled={reminder.sending}
          className="flex items-center justify-center gap-2 w-full text-white font-bold transition-colors cursor-pointer border-none"
          style={{ backgroundColor: '#64748b', borderRadius: 12, padding: 13, fontSize: 14, marginBottom: 12 }}
        >
          <Mail size={16} /> {reminder.sending ? 'Sending...' : 'Email me a reminder to come back'}
        </button>
      )}

      <p className="text-center" style={{ fontSize: 13, color: '#94a3b8' }}>
        Questions?{' '}
        <a href="mailto:support@localreviewresponder.com" className="underline" style={{ color: '#145da0' }}>
          Contact support
        </a>
      </p>

      <a
        href="#top"
        onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        className="block text-center underline"
        style={{ fontSize: 13, color: '#145da0', marginTop: 12 }}
      >
        ← Back to top
      </a>
    </div>
  );
}

// ─── Main onboarding content ──────────────────────────────────────────────────
function OnboardingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [selected, setSelected] = useState<Scenario>('gbp-owner');
  const reminder = useReminder(session?.user?.email);

  const step = searchParams.get('step');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;

    if (step === 'no-locations') {
      setChecking(false);
      return;
    }

    const checkLocations = async () => {
      try {
        const response = await fetch('/api/subscriptions?active=true');
        if (!response.ok) {
          setChecking(false);
          return;
        }
        const data = await response.json();
        if (data.locations?.length > 0 || data.isAdmin || data.isComped) {
          router.replace('/dashboard');
          return;
        }
      } catch {
        // fetch failed — don't redirect
      }
      setChecking(false);
    };

    checkLocations();
  }, [status, router, step]);

  if (status === 'loading' || checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#145da0' }} />
      </div>
    );
  }

  if (step === 'no-locations') {
    return <NoLocationsFound />;
  }

  const isReady = selected === 'gbp-owner';

  return (
    <div id="top" className="flex flex-col items-center min-h-screen px-4 py-12">
      {/* Panel 1: Header + step info */}
      <div
        className="w-full max-w-2xl overflow-hidden"
        style={{ backgroundColor: '#ffffff', borderRadius: 20, border: '1px solid #ece7df' }}
      >
        {/* Header */}
        <div className="relative text-center" style={{ padding: '24px 32px', borderBottom: '1px solid #ece7df' }}>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="absolute bg-transparent border-none cursor-pointer hover:opacity-80"
            style={{ top: 16, right: 16, fontSize: 13, color: '#145da0', fontWeight: 600, textDecoration: 'none', padding: 0 }}
          >
            Sign out
          </button>
          <a href="https://localreviewresponder.com" target="_blank" rel="noopener noreferrer">
            <img src="/lrr-email-logo.png" alt="Local Review Responder" width={400} className="mx-auto" style={{ height: 'auto' }} />
          </a>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>Smarter review management for local businesses</p>
        </div>

        {/* Card body */}
        <div style={{ padding: '28px 32px 32px' }}>
          {/* Progress section */}
          <ProgressSection />

          {/* Eyebrow + headline */}
          <p className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '1.2px', color: '#145da0', marginBottom: 8 }}>
            Step 1 of 3
          </p>
          <h1 className="font-bold" style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Connect your Google Business Profile
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: '24px', marginBottom: 24 }}>
            Sign in with the Google account that manages your business profile to sync your reviews.
          </p>

          {/* Trial banner */}
          <div
            className="flex items-center gap-2.5"
            style={{ backgroundColor: '#eef8f1', border: '1px solid #a7dbba', borderRadius: 12, padding: '12px 16px', marginBottom: 22 }}
          >
            <Gift size={18} color="#1d6b3b" className="flex-shrink-0" />
            <span style={{ fontSize: 14, color: '#1d6b3b' }}>
              14-day free trial — cancel before day 14 and you won&apos;t be charged.
            </span>
          </div>

          {/* Requirements */}
          <p className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '1px', color: '#64748b', marginBottom: 4 }}>
            To connect, you&apos;ll need
          </p>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: '22px', marginBottom: 0 }}>
            A verified Google Business Profile and Owner or Manager access on that profile.
          </p>
        </div>
      </div>

      {/* Panel 2: Situation selector */}
      <div
        className="w-full max-w-2xl overflow-hidden mt-4"
        style={{ backgroundColor: '#ffffff', borderRadius: 20, border: '1px solid #ece7df' }}
      >
        <div style={{ padding: '28px 32px 0' }}>
          {/* Heading */}
          <h2 className="font-bold" style={{ fontSize: 22, color: '#0f172a', marginBottom: 16 }}>
            Select your situation
          </h2>

          {/* Radio selector */}
          <div style={{ border: '1px solid #ece7df', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
            {scenarios.map((s, i) => {
              const isSelected = selected === s.key;
              const Icon = s.icon;
              return (
                <label
                  key={s.key}
                  className="w-full transition-colors cursor-pointer"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '14px 16px',
                    backgroundColor: isSelected ? s.selectedBg : '#ffffff',
                    borderLeft: isSelected ? `3px solid ${s.borderColor}` : '3px solid transparent',
                    borderBottom: i < scenarios.length - 1 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  <input
                    type="radio"
                    name="situation"
                    value={s.value}
                    checked={isSelected}
                    onChange={() => setSelected(s.key)}
                    className="sr-only"
                  />
                  <Icon size={16} color={isSelected ? s.iconColor : '#94a3b8'} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold" style={{ fontSize: 14, color: isSelected ? s.titleColor : '#0f172a', margin: 0 }}>
                      {s.title}
                    </p>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0', lineHeight: '20px' }}>
                      {s.sub}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Contextual hint */}
          <ContextualHint scenario={selected} reminder={reminder} />
        </div>

        {/* Card footer */}
        <div style={{ padding: '20px 32px 28px' }}>
          {/* CTA */}
          {isReady ? (
            <a
              href="/api/auth/link-google"
              className="flex items-center justify-center gap-2 w-full text-white font-bold transition-colors"
              style={{ backgroundColor: '#145da0', borderRadius: 12, padding: 16, fontSize: 16 }}
            >
              Connect Google account <ArrowRight size={16} />
            </a>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-2 w-full text-white font-bold cursor-not-allowed"
              style={{ backgroundColor: '#94a3b8', borderRadius: 12, padding: 16, fontSize: 16 }}
            >
              Connect Google account (not available yet)
            </button>
          )}

          {/* Secondary escape */}
          <a
            href="#off-ramp"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('off-ramp')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="block text-center"
            style={{ fontSize: 13, color: '#94a3b8', marginTop: 12 }}
          >
            Having trouble? See what to do ↓
          </a>
        </div>
      </div>

      {/* Off-ramp section */}
      <OffRamp reminder={reminder} />

      {/* Bottom spacer */}
      <div style={{ height: 48 }} />
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#145da0' }} />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
