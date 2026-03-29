'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, LockKeyhole, MapPin, Gift, Mail, ArrowRight } from 'lucide-react';

// ─── Scenario type ────────────────────────────────────────────────────────────
type Scenario = 'ready' | 'no-access' | 'no-gbp';

// ─── No-locations fallback (preserved from original) ──────────────────────────
function NoLocationsFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div
        className="w-full overflow-hidden"
        style={{ maxWidth: 560, backgroundColor: '#ffffff', borderRadius: 20, border: '1px solid #ece7df' }}
      >
        {/* Header */}
        <div className="text-center" style={{ padding: '28px 28px 20px', borderBottom: '1px solid #ece7df' }}>
          <a href="https://localreviewresponder.com">
            <img src="/lrr-email-logo.png" alt="Local Review Responder" width={400} className="mx-auto" style={{ height: 'auto' }} />
          </a>
          <p className="mt-2" style={{ fontSize: 13, color: '#94a3b8' }}>Smarter review management for local businesses</p>
        </div>

        <div style={{ padding: '28px 28px 32px' }}>
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
              style={{ backgroundColor: '#145da0', borderRadius: 12, padding: '16px', fontSize: 16 }}
            >
              Try a Different Google Account
            </a>
            <a
              href="mailto:support@localreviewresponder.com"
              className="flex items-center justify-center gap-2 w-full font-medium transition-colors"
              style={{ backgroundColor: '#ffffff', border: '1px solid #ece7df', borderRadius: 12, padding: '16px', fontSize: 15, color: '#64748b' }}
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

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepProgress() {
  const steps = [
    { label: 'Connect Google', num: 1 },
    { label: 'Choose location', num: 2 },
    { label: 'Start trial', num: 3 },
  ];

  return (
    <div className="flex items-center justify-center gap-0 my-6">
      {steps.map((s, i) => (
        <div key={s.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className="flex items-center justify-center rounded-full font-bold"
              style={{
                width: 32,
                height: 32,
                fontSize: 14,
                backgroundColor: s.num === 1 ? '#145da0' : '#e2e8f0',
                color: s.num === 1 ? '#ffffff' : '#94a3b8',
              }}
            >
              {s.num}
            </div>
            <span
              className="mt-1 font-medium"
              style={{ fontSize: 12, color: s.num === 1 ? '#145da0' : '#94a3b8' }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 48, height: 2, backgroundColor: '#e2e8f0', marginLeft: 8, marginRight: 8, marginBottom: 18 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Scenario option config ───────────────────────────────────────────────────
const scenarios: {
  key: Scenario;
  icon: typeof CheckCircle2;
  title: string;
  sub: string;
  selectedBg: string;
  borderColor: string;
  iconColor: string;
  titleColor: string;
}[] = [
  {
    key: 'ready',
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
function ContextualHint({ scenario }: { scenario: Scenario }) {
  if (scenario === 'ready') {
    return (
      <div className="mt-4" style={{ backgroundColor: '#eef8f1', border: '1px solid #a7dbba', borderRadius: 12, padding: '12px 16px' }}>
        <p style={{ fontSize: 14, color: '#1d6b3b', margin: 0, lineHeight: '22px' }}>
          You&apos;re all set — click below to connect your Google account and start syncing your reviews.
        </p>
      </div>
    );
  }

  if (scenario === 'no-access') {
    return (
      <div className="mt-4" style={{ backgroundColor: '#fdf7ec', border: '1px solid #e8c77a', borderRadius: 12, padding: '12px 16px' }}>
        <p style={{ fontSize: 14, color: '#9a5616', margin: 0, lineHeight: '22px' }}>
          You&apos;ll need the profile Owner to add you at{' '}
          <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: '#9a5616' }}>
            business.google.com
          </a>{' '}
          → Manage → Users. Once added as Owner or Manager, come back and connect.
        </p>
        <a href="/api/reminder" className="inline-flex items-center gap-1.5 mt-2 underline font-medium" style={{ fontSize: 13, color: '#9a5616' }}>
          <Mail size={14} /> Email me a reminder to come back
        </a>
      </div>
    );
  }

  return (
    <div className="mt-4" style={{ backgroundColor: '#eef5fe', border: '1px solid #a9c9f1', borderRadius: 12, padding: '12px 16px' }}>
      <p style={{ fontSize: 14, color: '#135d9c', margin: 0, lineHeight: '22px' }}>
        Create your free profile at{' '}
        <a href="https://business.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: '#135d9c' }}>
          business.google.com
        </a>
        . Google typically verifies new profiles within a few days — come back once confirmed.
      </p>
      <a href="/api/reminder" className="inline-flex items-center gap-1.5 mt-2 underline font-medium" style={{ fontSize: 13, color: '#135d9c' }}>
        <Mail size={14} /> Email me a reminder to come back
      </a>
    </div>
  );
}

// ─── Off-ramp section ─────────────────────────────────────────────────────────
function OffRamp() {
  const amberSteps = [
    'Find out who the current Owner of the profile is — usually the person who set up the Google account for the business.',
    'Ask them to add you as Owner or Manager at business.google.com → Manage → Users.',
    'Once added, come back here and connect using that Google account.',
  ];

  const blueSteps = [
    'Create your profile for free at business.google.com. Setup takes about 10 minutes.',
    'Wait for Google to verify it — usually a few days. You\'ll get an email when confirmed.',
    'Once verified, sign back in and connect your profile to start your free trial.',
  ];

  return (
    <div id="off-ramp" className="w-full mx-auto" style={{ maxWidth: 560, marginTop: 24, paddingBottom: 48 }}>
      {/* Amber card */}
      <div style={{ backgroundColor: '#fdf7ec', border: '1px solid #e8c77a', borderRadius: 14, padding: 20 }}>
        <div className="flex items-center gap-2 mb-3">
          <LockKeyhole size={16} color="#9a5616" />
          <span className="font-bold" style={{ fontSize: 15, color: '#9a5616' }}>I have a GBP but can&apos;t access it</span>
        </div>
        <div className="space-y-3">
          {amberSteps.map((text, i) => (
            <div key={i} className="flex gap-3">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
                style={{ width: 24, height: 24, backgroundColor: '#f5dba8', color: '#9a5616', fontSize: 13 }}
              >
                {i + 1}
              </div>
              <p style={{ fontSize: 14, color: '#9a5616', lineHeight: '22px', margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Blue card */}
      <div style={{ backgroundColor: '#eef5fe', border: '1px solid #a9c9f1', borderRadius: 14, padding: 20, marginTop: 12 }}>
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} color="#135d9c" />
          <span className="font-bold" style={{ fontSize: 15, color: '#135d9c' }}>I don&apos;t have a Google Business Profile yet</span>
        </div>
        <div className="space-y-3">
          {blueSteps.map((text, i) => (
            <div key={i} className="flex gap-3">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-full font-bold"
                style={{ width: 24, height: 24, backgroundColor: '#c0d9f5', color: '#135d9c', fontSize: 13 }}
              >
                {i + 1}
              </div>
              <p style={{ fontSize: 14, color: '#135d9c', lineHeight: '22px', margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Off-ramp footer */}
      <div className="text-center" style={{ marginTop: 16 }}>
        <a
          href="/api/reminder"
          className="flex items-center justify-center gap-2 w-full text-white font-bold transition-colors"
          style={{ backgroundColor: '#64748b', borderRadius: 12, padding: 16, fontSize: 15 }}
        >
          <Mail size={16} /> Email me a reminder to come back
        </a>
        <p className="mt-3" style={{ fontSize: 13, color: '#94a3b8' }}>
          Questions?{' '}
          <a href="mailto:support@localreviewresponder.com" className="underline" style={{ color: '#94a3b8' }}>
            Contact support
          </a>
        </p>
        <a
          href="#top"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="inline-block mt-1"
          style={{ fontSize: 13, color: '#145da0' }}
        >
          ← Back to top
        </a>
      </div>
    </div>
  );
}

// ─── Main onboarding content ──────────────────────────────────────────────────
function OnboardingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [selected, setSelected] = useState<Scenario>('ready');

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

  const isReady = selected === 'ready';

  return (
    <div id="top" className="flex flex-col items-center min-h-screen px-4 py-12">
      {/* Main card */}
      <div
        className="w-full overflow-hidden"
        style={{ maxWidth: 560, backgroundColor: '#ffffff', borderRadius: 20, border: '1px solid #ece7df' }}
      >
        {/* Header */}
        <div className="text-center" style={{ padding: '28px 28px 20px', borderBottom: '1px solid #ece7df' }}>
          <a href="https://localreviewresponder.com">
            <img src="/lrr-email-logo.png" alt="Local Review Responder" width={400} className="mx-auto" style={{ height: 'auto' }} />
          </a>
          <p className="mt-2" style={{ fontSize: 13, color: '#94a3b8' }}>Smarter review management for local businesses</p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px 32px' }}>
          <StepProgress />

          {/* Eyebrow + headline */}
          <p className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '1.2px', color: '#145da0', marginBottom: 8 }}>
            Step 1 of 3
          </p>
          <h1 className="font-bold" style={{ fontSize: 22, color: '#0f172a', marginBottom: 8 }}>
            Connect your Google Business Profile
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: '24px', marginBottom: 20 }}>
            Sign in with the Google account that manages your business profile to sync your reviews.
          </p>

          {/* Trial banner */}
          <div
            className="flex items-center gap-2.5"
            style={{ backgroundColor: '#eef8f1', border: '1px solid #a7dbba', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}
          >
            <Gift size={18} color="#1d6b3b" className="flex-shrink-0" />
            <span style={{ fontSize: 14, color: '#1d6b3b' }}>
              14-day free trial — cancel before day 14 and you won&apos;t be charged.
            </span>
          </div>

          {/* Section heading */}
          <p className="font-bold uppercase" style={{ fontSize: 11, letterSpacing: '1px', color: '#64748b', marginBottom: 4 }}>
            To connect, you&apos;ll need
          </p>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: '22px', marginBottom: 16 }}>
            A verified Google Business Profile and Owner or Manager access on that profile. Select the option that best describes your situation:
          </p>

          {/* Radio selector */}
          <div style={{ border: '1px solid #ece7df', borderRadius: 14, overflow: 'hidden' }}>
            {scenarios.map((s, i) => {
              const isSelected = selected === s.key;
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSelected(s.key)}
                  className="w-full text-left transition-colors"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '14px 16px',
                    backgroundColor: isSelected ? s.selectedBg : '#ffffff',
                    borderLeft: isSelected ? `3px solid ${s.borderColor}` : '3px solid transparent',
                    borderBottom: i < scenarios.length - 1 ? '1px solid #f1f5f9' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={16} color={isSelected ? s.iconColor : '#94a3b8'} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold" style={{ fontSize: 14, color: isSelected ? s.titleColor : '#0f172a', margin: 0 }}>
                      {s.title}
                    </p>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0', lineHeight: '20px' }}>
                      {s.sub}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Contextual hint */}
          <ContextualHint scenario={selected} />

          {/* CTA */}
          {isReady ? (
            <a
              href="/api/auth/link-google"
              className="flex items-center justify-center gap-2 w-full text-white font-bold transition-colors mt-6"
              style={{ backgroundColor: '#145da0', borderRadius: 12, padding: 16, fontSize: 16 }}
            >
              Connect Google account <ArrowRight size={16} />
            </a>
          ) : (
            <button
              disabled
              className="flex items-center justify-center gap-2 w-full text-white font-bold mt-6 cursor-not-allowed"
              style={{ backgroundColor: '#94a3b8', borderRadius: 12, padding: 16, fontSize: 16 }}
            >
              Connect Google account (not available yet)
            </button>
          )}

          {/* Secondary escape */}
          <div className="text-center mt-4">
            <a
              href="#off-ramp"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('off-ramp')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ fontSize: 13, color: '#94a3b8' }}
            >
              Having trouble? See what to do ↓
            </a>
          </div>

          {/* Skip for now */}
          <div className="text-center mt-2">
            <a
              href="/dashboard?setup=skipped"
              className="underline"
              style={{ fontSize: 13, color: '#94a3b8' }}
            >
              I don&apos;t have a Google Business Profile yet — skip for now
            </a>
          </div>
        </div>
      </div>

      {/* Off-ramp section */}
      <OffRamp />
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
