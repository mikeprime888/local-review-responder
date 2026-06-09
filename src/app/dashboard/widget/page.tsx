'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Location {
  id: string;
  title: string;
  gmbAccountId: string;
  gmbLocationId: string;
}

interface WidgetSettings {
  layout: string;
  theme: string;
  accentColor: string;
  backgroundColor: string | null;
  showName: boolean;
  showDate: boolean;
  showBadge: boolean;
  showHeaderBar: boolean;
  showWriteReviewButton: boolean;
  limitReviews: boolean;
  maxReviews: number;
  minRating: number;
}

// Pick a readable text color for a given hex background (WCAG relative luminance).
// Mirror of public/widget.js readableOn() so the preview matches the live widget.
function readableOn(hex: string): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const r = parseInt(c.substr(0, 2), 16) / 255;
  const g = parseInt(c.substr(2, 2), 16) / 255;
  const b = parseInt(c.substr(4, 2), 16) / 255;
  const L = (x: number) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
  const lum = 0.2126 * L(r) + 0.7152 * L(g) + 0.0722 * L(b);
  return lum > 0.5 ? '#1f2937' : '#f3f4f6';
}

// Keep a link legible AS a color on a given background: use the accent if it
// has >=3:1 WCAG contrast on bg, else fall back to a safe link blue. Mirror of
// public/widget.js linkColorOn(). Used for the "Read more" link on the white card.
function linkColorOn(accentHex: string, bgHex: string): string {
  const lum = (hex: string): number => {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    const r = parseInt(c.substr(0, 2), 16) / 255;
    const g = parseInt(c.substr(2, 2), 16) / 255;
    const b = parseInt(c.substr(4, 2), 16) / 255;
    const L = (x: number) => (x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4));
    return 0.2126 * L(r) + 0.7152 * L(g) + 0.0722 * L(b);
  };
  const la = lum(accentHex);
  const lb = lum(bgHex);
  const ratio = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  return ratio >= 3 ? accentHex : '#1a73e8';
}

// Fallback sample reviews (used only if no published reviews exist)
const SAMPLE_REVIEWS = [
  {
    id: '1',
    authorName: 'Sarah M.',
    rating: 5,
    text: 'Absolutely wonderful experience! The team was professional, friendly, and went above and beyond to help us. We had a complex situation that required a lot of attention to detail, and they handled everything with grace. From start to finish, the communication was excellent and we always felt like we were in good hands. Highly recommend to anyone looking for top-notch service.',
    createTime: '2026-02-15T10:30:00Z',
  },
  {
    id: '2',
    authorName: 'James T.',
    rating: 4,
    text: 'Great service overall. Very responsive and easy to work with. Will definitely be coming back for future needs.',
    createTime: '2026-02-10T14:20:00Z',
  },
  {
    id: '3',
    authorName: 'Emily R.',
    rating: 5,
    text: 'Best in the business! They really care about their customers and it shows in every interaction. I have been using their services for over a year now and the quality has been consistently outstanding. The staff is knowledgeable, patient, and always willing to go the extra mile. Five stars all the way — would not hesitate to recommend them to friends and family.',
    createTime: '2026-01-28T09:15:00Z',
  },
];

interface LiveReview {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  createTime: string;
  reviewerPhoto?: string | null;
}

function getInitial(name: string): string {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ─── Review Modal ───────────────────────────────────────────────────────────
function ReviewModal({
  review,
  settings,
  onClose,
}: {
  review: typeof SAMPLE_REVIEWS[0];
  settings: WidgetSettings;
  onClose: () => void;
}) {
  const isDark = settings.theme === 'dark';
  const accent = settings.accentColor || '#4285F4';

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? '#1f2937' : '#ffffff',
          borderRadius: '16px',
          padding: '28px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            background: isDark ? '#374151' : '#f3f4f6',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: isDark ? '#9ca3af' : '#6b7280',
          }}
        >
          ✕
        </button>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: accent,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '20px',
              flexShrink: 0,
            }}
          >
            {getInitial(review.authorName)}
          </div>
          <div>
            {settings.showName && (
              <div style={{ fontWeight: 600, color: isDark ? '#f3f4f6' : '#1f2937', fontSize: '16px' }}>
                {review.authorName}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <div style={{ display: 'flex', gap: '1px' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    style={{
                      color: i <= review.rating ? '#F4B400' : (isDark ? '#4b5563' : '#dadce0'),
                      fontSize: '18px',
                      lineHeight: 1,
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
              <svg viewBox="0 0 48 48" style={{ width: 18, height: 18, flexShrink: 0 }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Full review text */}
        <p style={{ color: isDark ? '#d1d5db' : '#374151', fontSize: '14px', lineHeight: '1.7', margin: '0 0 14px 0' }}>
          {review.text}
        </p>

        {settings.showDate && (
          <div style={{ color: isDark ? '#6b7280' : '#9ca3af', fontSize: '12px' }}>
            {formatDate(review.createTime)}
          </div>
        )}
      </div>
    </div>
  );
}

interface PreviewLocation {
  averageRating: number | null;
  totalReviews: number;
  newReviewUri: string | null;
}

// ─── Aggregate Summary Strip Preview ────────────────────────────────────────
// Mirrors public/widget.js renderSummary() — the multi-location blended rating
// strip (badge only, no cards/carousel/modal). Sample data here; the live
// widget computes the count-weighted blend server-side via /api/widget/summary.
// Uses the same scaled font sizes as WidgetPreview's header strip for dashboard
// consistency (the live strip renders at 30px).
function SummaryStripPreview() {
  const bgWrap = '#EBF2FA';
  const headerText = readableOn(bgWrap);
  const avg = 4.7; // sample blended rating
  const total = 512; // sample summed review count
  return (
    <div
      style={{
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
        background: bgWrap,
        borderRadius: '20px',
        padding: '28px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        textAlign: 'center',
        lineHeight: 1.2,
      }}
    >
      <span style={{ fontSize: '18px', fontWeight: 500, color: headerText }}>Overall rating</span>
      <span style={{ fontSize: '24px', fontWeight: 700, color: headerText }}>{avg.toFixed(1)}</span>
      <span style={{ color: '#F4B400', fontSize: '22px', lineHeight: 1 }}>★</span>
      <span style={{ fontSize: '18px', fontWeight: 500, color: headerText }}>based on</span>
      <span style={{ fontSize: '24px', fontWeight: 700, color: headerText }}>{total}</span>
      <span style={{ fontSize: '18px', fontWeight: 500, color: headerText }}>reviews</span>
    </div>
  );
}

// ─── Live Preview Component ─────────────────────────────────────────────────
function WidgetPreview({
  settings,
  liveReviews,
  reviewsLoading,
  previewLocation,
}: {
  settings: WidgetSettings;
  liveReviews: LiveReview[];
  reviewsLoading: boolean;
  previewLocation: PreviewLocation | null;
}) {
  const [carouselPage, setCarouselPage] = useState(0);
  const [modalReview, setModalReview] = useState<LiveReview | null>(null);

  const isDark = settings.theme === 'dark';
  const accent = settings.accentColor || '#4285F4';
  const layout = settings.layout || 'carousel';
  const CARDS_PER_PAGE = 3;

  // Use live reviews if available, otherwise fall back to sample data
  const previewReviews: LiveReview[] = liveReviews.length > 0 ? liveReviews : SAMPLE_REVIEWS;
  const isUsingSampleData = liveReviews.length === 0;
  const totalPages = Math.ceil(previewReviews.length / CARDS_PER_PAGE);

  // Colors
  const containerBg = settings.backgroundColor || (isDark ? '#1a1a2e' : '#EBF2FA');
  const headerText = readableOn(containerBg);
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#f3f4f6' : '#1f2937';
  const subText = isDark ? '#9ca3af' : '#5f6368';
  const borderColor = isDark ? '#374151' : '#e8eaed';
  const arrowBg = isDark ? '#374151' : '#ffffff';
  const arrowColor = isDark ? '#d1d5db' : '#5f6368';

  // Reset page when layout changes
  useEffect(() => {
    setCarouselPage(0);
  }, [layout]);

  // Auto-rotate carousel
  useEffect(() => {
    if (layout !== 'carousel') return;
    const interval = setInterval(() => {
      setCarouselPage((prev) => (prev + 1) % totalPages);
    }, 5000);
    return () => clearInterval(interval);
  }, [layout, totalPages]);

  const visibleReviews = layout === 'carousel'
    ? previewReviews.slice(carouselPage * CARDS_PER_PAGE, carouselPage * CARDS_PER_PAGE + CARDS_PER_PAGE)
    : previewReviews;

  const GoogleBadge = () => (
    <svg viewBox="0 0 48 48" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );

  const StarRow = ({ rating }: { rating: number }) => (
    <div style={{ display: 'flex', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{ color: i <= rating ? '#F4B400' : (isDark ? '#4b5563' : '#dadce0'), fontSize: '18px', lineHeight: 1 }}
        >
          ★
        </span>
      ))}
    </div>
  );

  const ReviewCard = ({ review, style }: { review: LiveReview; style?: React.CSSProperties }) => {
    const commentRef = useRef<HTMLParagraphElement>(null);
    const [showReadMore, setShowReadMore] = useState(false);

    // Reveal "Read more" only when the comment actually overflows the 5-line
    // clamp — measured from real layout (scrollHeight vs clientHeight), not
    // character count — so the visual truncation and the link can never
    // disagree. Mirrors public/widget.js checkOverflow(). Re-measures on
    // width change (resize) and when the review text changes.
    useEffect(() => {
      const el = commentRef.current;
      if (!el) return;
      const measure = () => {
        if (!el.clientHeight) return; // not laid out
        setShowReadMore(el.scrollHeight - el.clientHeight > 2);
      };
      const raf = requestAnimationFrame(measure);
      window.addEventListener('resize', measure);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', measure);
      };
    }, [review.text]);

    return (
      <div
        style={{
          background: cardBg,
          borderRadius: '12px',
          padding: '20px',
          border: `1px solid ${borderColor}`,
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          minHeight: '200px',
          ...style,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {review.reviewerPhoto ? (
            <img
              src={review.reviewerPhoto}
              alt={review.authorName}
              style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: accent,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
              fontSize: '16px',
              flexShrink: 0,
            }}
          >
            {getInitial(review.authorName)}
          </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {settings.showName && (
              <div style={{ fontWeight: 600, color: textColor, fontSize: '18px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {review.authorName}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
              <StarRow rating={review.rating} />
              <GoogleBadge />
            </div>
          </div>
        </div>

        {/* Date — above the comment, matching the live widget (buildCard):
            avatar/name/stars → date → comment → Read more */}
        {settings.showDate && (
          <div style={{ color: subText, fontSize: '16px' }}>{formatDate(review.createTime)}</div>
        )}

        {/* Text — full comment, visually clamped to 5 lines */}
        <p
          ref={commentRef}
          style={{
            color: isDark ? '#d1d5db' : '#374151',
            fontSize: '16px',
            lineHeight: '1.5',
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {review.text}
        </p>
        {/* Read more — sibling below the clamp (an inline node inside a
            -webkit-line-clamp box gets clamped away); shown only when the
            comment actually overflows. Always the final element in the card. */}
        {showReadMore && (
          <button
            onClick={() => setModalReview(review)}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              color: linkColorOn(accent, '#ffffff'),
              fontSize: '16px',
              fontWeight: 500,
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left',
            }}
          >
            Read more
          </button>
        )}
      </div>
    );
  };

  // Inside the colored wrapper. Uses headerText so it contrasts against
  // the configurable wrapper background.
  const PoweredByFooter = () => (
    <div style={{ textAlign: 'center', marginTop: '18px' }}>
      <a
        href="https://localreviewresponder.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: '10px',
          fontVariant: 'small-caps',
          letterSpacing: '0.5px',
          color: headerText,
          textDecoration: 'none',
          opacity: 0.7,
        }}
      >
        powered by Local Review Responder LLC
      </a>
    </div>
  );

  const ArrowButton = ({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: arrowBg,
        border: `1px solid ${borderColor}`,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: arrowColor,
        fontSize: '16px',
        flexShrink: 0,
      }}
    >
      {direction === 'left' ? '‹' : '›'}
    </button>
  );

  return (
    <>
      {reviewsLoading && (
        <div style={{ textAlign: 'center', padding: '12px 0', color: isDark ? '#9ca3af' : '#6b7280', fontSize: '13px' }}>
          Loading live reviews...
        </div>
      )}
      {!reviewsLoading && isUsingSampleData && (
        <div style={{ marginBottom: '8px', fontSize: '12px', color: isDark ? '#6b7280' : '#9ca3af', textAlign: 'center' }}>
          No published reviews yet — showing sample data. Publish reviews from the{' '}
          <a href="/dashboard/reviews" style={{ color: '#4285F4' }}>Reviews</a> page.
        </div>
      )}
      <div
        style={{
          background: containerBg,
          borderRadius: '12px',
          padding: '20px',
          paddingTop: '35px',
          transition: 'all 0.3s ease',
          opacity: reviewsLoading ? 0.5 : 1,
        }}
      >
        {/* Header (overall rating + optional inline Write a review button) */}
        {settings.showHeaderBar && (
          <div
            style={{
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '18px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                textAlign: 'center',
                lineHeight: 1.2,
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 500, color: headerText }}>Overall rating</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: headerText }}>
                {(previewLocation?.averageRating ?? 4.8).toFixed(1)}
              </span>
              <span style={{ color: '#F4B400', fontSize: '22px', lineHeight: 1 }}>★</span>
              <span style={{ fontSize: '18px', fontWeight: 500, color: headerText }}>based on</span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: headerText }}>
                {previewLocation?.totalReviews ?? 24}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 500, color: headerText }}>reviews</span>
            </div>
            {settings.showWriteReviewButton && (
              <a
                href={previewLocation?.newReviewUri || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => { if (!previewLocation?.newReviewUri) e.preventDefault(); }}
                style={{
                  background: accent,
                  color: readableOn(accent),
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '10px 22px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  cursor: previewLocation?.newReviewUri ? 'pointer' : 'default',
                  opacity: previewLocation?.newReviewUri ? 1 : 0.6,
                }}
              >
                Write a review
              </a>
            )}
          </div>
        )}

        {/* Carousel Layout — multi-card, 3 per page */}
        {layout === 'carousel' && (
          <div>
            {/* Cards row with arrows */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ArrowButton
                direction="left"
                onClick={() => setCarouselPage((p) => (p <= 0 ? totalPages - 1 : p - 1))}
              />
              <div
                style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(visibleReviews.length, CARDS_PER_PAGE)}, 1fr)`,
                  gap: '12px',
                }}
              >
                {visibleReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
              <ArrowButton
                direction="right"
                onClick={() => setCarouselPage((p) => (p >= totalPages - 1 ? 0 : p + 1))}
              />
            </div>

            {/* Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '14px' }}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCarouselPage(i)}
                  style={{
                    width: i === carouselPage ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: i === carouselPage ? accent : (isDark ? '#4b5563' : '#d1d5db'),
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>

            <PoweredByFooter />
          </div>
        )}

        {/* Grid Layout */}
        {layout === 'grid' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {SAMPLE_REVIEWS.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <PoweredByFooter />
          </div>
        )}

        {/* List Layout */}
        {layout === 'list' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {SAMPLE_REVIEWS.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <PoweredByFooter />
          </div>
        )}
      </div>

      {/* Modal */}
      {modalReview && (
        <ReviewModal review={modalReview} settings={settings} onClose={() => setModalReview(null)} />
      )}
    </>
  );
}

// ─── Main Widget Content ────────────────────────────────────────────────────
function WidgetContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'design' | 'embed'>('design');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [previewLocation, setPreviewLocation] = useState<PreviewLocation | null>(null);

  const [settings, setSettings] = useState<WidgetSettings>({
    layout: 'carousel',
    theme: 'light',
    accentColor: '#4285F4',
    backgroundColor: null,
    showName: true,
    showDate: true,
    showBadge: true,
    showHeaderBar: true,
    showWriteReviewButton: true,
    limitReviews: true,
    maxReviews: 10,
    minRating: 1,
  });

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);

  // Fetch locations
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/google/locations')
      .then((res) => res.json())
      .then((data) => {
        const locs = data.locations || [];
        setLocations(locs);
        if (locs.length > 0) {
          // Prefer the URL param, then the shared localStorage key (written by the
          // dashboard and reviews page), then first-in-list. Validate the saved id
          // against this page's list so an id absent here falls back safely.
          const savedId = searchParams.get('locationId') || (typeof window !== 'undefined' ? localStorage.getItem('selectedLocationId') : null);
          setSelectedLocationId(
            savedId && locs.find((l: Location) => l.id === savedId) ? savedId : locs[0].id
          );
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, searchParams]);

  // Fetch widget settings when location changes
  useEffect(() => {
    if (!selectedLocationId) return;
    fetch(`/api/widget/settings?locationId=${selectedLocationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings;
          setSettings({
            layout: s.layout || 'carousel',
            theme: s.theme || 'light',
            accentColor: s.accentColor || '#4285F4',
            backgroundColor: s.backgroundColor ?? null,
            showName: s.showName !== false,
            showDate: s.showDate !== false,
            showBadge: s.showBadge !== false,
            showHeaderBar: s.showHeaderBar !== false,
            showWriteReviewButton: s.showWriteReviewButton !== false,
            limitReviews: s.limitReviews !== false,
            maxReviews: s.maxReviews ?? 10,
            minRating: s.minRating ?? 1,
          });
        }
      })
      .catch(() => {});
  }, [selectedLocationId]);

  // Fetch live published reviews for preview
  useEffect(() => {
    if (!selectedLocationId) return;
    setReviewsLoading(true);
    fetch(`/api/widget/${selectedLocationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.location) {
          setPreviewLocation({
            averageRating: data.location.averageRating ?? null,
            totalReviews: data.location.totalReviews ?? 0,
            newReviewUri: data.location.newReviewUri ?? null,
          });
        } else {
          setPreviewLocation(null);
        }
        if (data.reviews && data.reviews.length > 0) {
          const mapped: LiveReview[] = data.reviews.map((r: any) => ({
            id: r.id,
            authorName: r.reviewerName || 'Anonymous',
            rating: r.starRating,
            text: r.comment || '',
            createTime: r.googleCreatedAt,
            reviewerPhoto: r.reviewerPhoto || null,
          }));
          setLiveReviews(mapped);
        } else {
          setLiveReviews([]);
        }
        setReviewsLoading(false);
      })
      .catch(() => {
        setLiveReviews([]);
        setPreviewLocation(null);
        setReviewsLoading(false);
      });
  }, [selectedLocationId]);

  // Save settings
  const saveSettings = async () => {
    if (!selectedLocationId) return;
    setSaving(true);
    try {
      await fetch('/api/widget/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocationId,
          layout: settings.layout,
          theme: settings.theme,
          accentColor: settings.accentColor,
          backgroundColor: settings.backgroundColor,
          showName: settings.showName,
          showDate: settings.showDate,
          showBadge: settings.showBadge,
          showHeaderBar: settings.showHeaderBar,
          showWriteReviewButton: settings.showWriteReviewButton,
          limitReviews: settings.limitReviews,
          maxReviews: settings.maxReviews,
          minRating: settings.minRating,
        }),
      });
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
    setSaving(false);
  };

  const appOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'https://app.localreviewresponder.com';

  const embedCode = selectedLocationId
    ? `<div id="lrr-widget" data-location-id="${selectedLocationId}"></div>\n<script src="${appOrigin}/widget.js" async><\/script>`
    : '';

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Widget</h1>
            <p className="text-sm text-gray-600 mt-1">Customize and embed reviews on your website</p>
          </div>
          {locations.length > 1 && (
            <select
              value={selectedLocationId || ''}
              onChange={(e) => { setSelectedLocationId(e.target.value); localStorage.setItem('selectedLocationId', e.target.value); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Location info */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <p className="text-sm text-gray-600">
            Location:{' '}
            <span className="font-semibold text-gray-900">{selectedLocation?.title || 'Select a location'}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Manage which reviews appear in the widget from the{' '}
            <a href="/dashboard/reviews" className="text-blue-600 hover:underline">Reviews</a> page.
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {(['design', 'embed'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'design' ? '🎨 Design' : '📋 Embed Code'}
              </button>
            ))}
          </nav>
        </div>

        {/* Design Tab */}
        {activeTab === 'design' && (
          <div className="space-y-6">
            {/* Settings Panel */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Widget Settings</h3>
              <div className="space-y-5">

                {/* Layout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['carousel', 'grid', 'list'].map((l) => (
                      <button
                        key={l}
                        onClick={() => setSettings({ ...settings, layout: l })}
                        className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                          settings.layout === l
                            ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {l === 'carousel' ? '◀ Carousel' : l === 'grid' ? '▦ Grid' : '☰ List'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme + Accent */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['light', 'dark'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setSettings({ ...settings, theme: t })}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            settings.theme === t
                              ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {t === 'light' ? '☀️ Light' : '🌙 Dark'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settings.accentColor || '#4285F4'}
                        onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                        className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settings.accentColor || '#4285F4'}
                        onChange={(e) => { let v = e.target.value.trim(); if (v && !v.startsWith('#')) v = '#' + v; setSettings({ ...settings, accentColor: v }); }}
                        placeholder="#4285F4"
                        maxLength={7}
                        className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.backgroundColor || '#EBF2FA'}
                      onChange={(e) => setSettings({ ...settings, backgroundColor: e.target.value })}
                      className="h-9 w-14 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.backgroundColor || '#EBF2FA'}
                      onChange={(e) => { let v = e.target.value.trim(); if (v && !v.startsWith('#')) v = '#' + v; setSettings({ ...settings, backgroundColor: v }); }}
                      placeholder="#EBF2FA"
                      maxLength={7}
                      className="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Header Bar */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700">Show overall rating bar</label>
                      <p className="text-xs text-gray-500 mt-0.5">Display rating and review count above reviews</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, showHeaderBar: !settings.showHeaderBar })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                        settings.showHeaderBar ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.showHeaderBar ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <div
                    className={`mt-3 pt-3 border-t border-gray-200 flex items-start justify-between gap-4 transition-opacity ${
                      settings.showHeaderBar ? 'opacity-100' : 'opacity-50 pointer-events-none'
                    }`}
                  >
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700">Show Write a review button</label>
                      <p className="text-xs text-gray-500 mt-0.5">Links to Google review form</p>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, showWriteReviewButton: !settings.showWriteReviewButton })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                        settings.showWriteReviewButton ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.showWriteReviewButton ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Number of Reviews + Min Rating */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Limit Reviews */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-gray-700">Limit Reviews</label>
                      <button
                        onClick={() => setSettings({ ...settings, limitReviews: !settings.limitReviews })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.limitReviews ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.limitReviews ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className={`transition-opacity ${settings.limitReviews ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                      <label className="block text-xs text-gray-500 mb-1">Number of reviews</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={settings.maxReviews}
                        onChange={(e) =>
                          setSettings({ ...settings, maxReviews: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)) })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  {/* Min Rating */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Minimum Rating</label>
                    <select
                      value={settings.minRating}
                      onChange={(e) => setSettings({ ...settings, minRating: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value={1}>⭐ 1+ stars (all)</option>
                      <option value={2}>⭐⭐ 2+ stars</option>
                      <option value={3}>⭐⭐⭐ 3+ stars</option>
                      <option value={4}>⭐⭐⭐⭐ 4+ stars</option>
                      <option value={5}>⭐⭐⭐⭐⭐ 5 stars only</option>
                    </select>
                  </div>
                </div>

                {/* Toggle Options */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {[
                    { key: 'showName' as const, label: 'Show reviewer name' },
                    { key: 'showDate' as const, label: 'Show review date' },
                    { key: 'showBadge' as const, label: 'Show Google badge' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center justify-between sm:flex-col sm:items-start sm:gap-2 bg-gray-50 rounded-lg p-3"
                    >
                      <span className="text-sm text-gray-700">{label}</span>
                      <button
                        onClick={() => setSettings({ ...settings, [key]: !settings[key] })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings[key] ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings[key] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </label>
                  ))}
                </div>

                {/* Save Button */}
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="w-full sm:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-900">Live Preview</h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Sample data</span>
              </div>
              <WidgetPreview settings={settings} liveReviews={liveReviews} reviewsLoading={reviewsLoading} previewLocation={previewLocation} />

              {/* Aggregate summary widget (multi-location, badge only) */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Aggregate summary widget</h4>
                  <span className="text-xs text-gray-400">multi-location · badge only</span>
                </div>
                <SummaryStripPreview />
              </div>
            </div>
          </div>
        )}

        {/* Embed Code Tab */}
        {activeTab === 'embed' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Embed Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Copy and paste this code into your website to display the review widget.
            </p>
            {!selectedLocationId ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                No location selected. Please make sure you have an active location set up.
              </div>
            ) : (
              <div className="relative">
                <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-sm overflow-x-auto">
                  <code>{embedCode}</code>
                </pre>
                <button
                  onClick={copyEmbed}
                  className="absolute top-3 right-3 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            )}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> The widget displays reviews you&apos;ve published on the{' '}
                <a href="/dashboard/reviews" className="underline">Reviews</a> page.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WidgetPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <WidgetContent />
    </Suspense>
  );
}
