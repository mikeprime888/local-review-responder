import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

interface Props {
  params: { locationId: string };
}

async function getWidgetData(locationId: string) {
  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: {
      subscription: {
        select: { status: true },
      },
      widgetSettings: true,
      reviews: {
        where: { isPublished: true },
        orderBy: [{ isFeatured: 'desc' }, { googleCreatedAt: 'desc' }],
        take: 20,
      },
    },
  });

  return location;
}

export default async function EmbedPage({ params }: Props) {
  const location = await getWidgetData(params.locationId);

  if (!location) {
    notFound();
  }

  const hasActiveSubscription =
    location.subscription?.status === 'active' ||
    location.subscription?.status === 'trialing';

  if (!hasActiveSubscription || location.reviews.length === 0) {
    return (
      <html>
        <body style={{ margin: 0, padding: 0 }}>
          <div style={{ display: 'none' }} />
        </body>
      </html>
    );
  }

  const settings = location.widgetSettings || {
    layout: 'list',
    theme: 'light',
    accentColor: '#3B82F6',
    showDate: true,
    showReviewerName: true,
    showReviewerPhoto: true,
    showRating: true,
    showReply: false,
    showSummary: true,
    showBadge: true,
    showReviewLink: false,
    maxReviews: 10,
    googleReviewUrl: null,
  };

  const reviews = location.reviews.slice(0, settings.maxReviews || 10);
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.starRating, 0) / reviews.length
      : 0;

  const theme = settings.theme === 'dark' ? 'dark' : 'light';
  const bgColor = theme === 'dark' ? '#111827' : '#ffffff';
  const textColor = theme === 'dark' ? '#f3f4f6' : '#1f2937';
  const mutedColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
  const borderColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const cardBg = theme === 'dark' ? '#1f2937' : '#ffffff';
  const summaryBg = theme === 'dark' ? '#1f2937' : '#f9fafb';

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const starDistribution = {
    5: reviews.filter((r) => r.starRating === 5).length,
    4: reviews.filter((r) => r.starRating === 4).length,
    3: reviews.filter((r) => r.starRating === 3).length,
    2: reviews.filter((r) => r.starRating === 2).length,
    1: reviews.filter((r) => r.starRating === 1).length,
  };
  const maxCount = Math.max(...Object.values(starDistribution), 1);

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Reviews - {location.title}</title>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: ${bgColor};
            color: ${textColor};
            padding: 20px;
          }
          .summary {
            display: flex;
            align-items: center;
            gap: 24px;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            background: ${summaryBg};
            border: 1px solid ${borderColor};
          }
          .summary-rating { text-align: center; }
          .summary-number { font-size: 48px; font-weight: 700; color: ${settings.accentColor}; }
          .summary-count { font-size: 14px; color: ${mutedColor}; }
          .summary-bars { flex: 1; }
          .bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 13px; }
          .bar-track { flex: 1; height: 8px; border-radius: 4px; background: ${borderColor}; overflow: hidden; }
          .bar-fill { height: 100%; border-radius: 4px; background: ${settings.accentColor}; }
          .reviews-list { display: flex; flex-direction: column; gap: 16px; }
          .review {
            padding: 20px;
            border-radius: 12px;
            background: ${cardBg};
            border: 1px solid ${borderColor};
          }
          .review-featured { border-color: ${settings.accentColor}; }
          .review-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
          .reviewer-photo { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
          .reviewer-placeholder {
            width: 44px; height: 44px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            background: ${borderColor}; font-weight: 600; font-size: 18px;
          }
          .reviewer-name { font-weight: 600; font-size: 15px; }
          .review-date { font-size: 13px; color: ${mutedColor}; }
          .stars { display: flex; gap: 2px; margin-bottom: 12px; }
          .star { width: 18px; height: 18px; }
          .star-filled { fill: #fbbf24; }
          .star-empty { fill: ${theme === 'dark' ? '#4b5563' : '#d1d5db'}; }
          .review-text { font-size: 15px; line-height: 1.6; }
          .review-reply {
            margin-top: 16px; padding: 12px 16px; border-radius: 8px; font-size: 14px;
            background: ${theme === 'dark' ? '#111827' : '#f3f4f6'};
            border-left: 3px solid ${settings.accentColor};
          }
          .reply-label { font-weight: 600; font-size: 12px; text-transform: uppercase; margin-bottom: 4px; color: ${mutedColor}; }
          .badge {
            display: flex; align-items: center; justify-content: center; gap: 6px;
            margin-top: 24px; padding: 12px; font-size: 12px;
            color: ${mutedColor}; text-decoration: none;
          }
          .review-link {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;
            text-decoration: none; margin-top: 20px;
            background: ${settings.accentColor}; color: white;
          }
          @media (max-width: 640px) {
            .summary { flex-direction: column; text-align: center; }
            .summary-bars { width: 100%; }
          }
        `,
          }}
        />
      </head>
      <body>
        {/* Summary */}
        {settings.showSummary && (
          <div className="summary">
            <div className="summary-rating">
              <div className="summary-number">{avgRating.toFixed(1)}</div>
              <div className="stars" style={{ justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`star ${star <= Math.round(avgRating) ? 'star-filled' : 'star-empty'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="summary-count">{reviews.length} reviews</div>
            </div>
            <div className="summary-bars">
              {[5, 4, 3, 2, 1].map((star) => (
                <div key={star} className="bar-row">
                  <span style={{ width: 20, textAlign: 'right' }}>{star}</span>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${(starDistribution[star as keyof typeof starDistribution] / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span style={{ width: 30, fontSize: 12, color: mutedColor }}>
                    {starDistribution[star as keyof typeof starDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="reviews-list">
          {reviews.map((review) => (
            <div
              key={review.id}
              className={`review ${review.isFeatured ? 'review-featured' : ''}`}
            >
              <div className="review-header">
                {settings.showReviewerPhoto && review.reviewerPhoto ? (
                  <img
                    src={review.reviewerPhoto}
                    alt={review.reviewerName || 'Reviewer'}
                    className="reviewer-photo"
                  />
                ) : (
                  <div className="reviewer-placeholder">
                    {getInitials(review.reviewerName)}
                  </div>
                )}
                <div>
                  {settings.showReviewerName && (
                    <div className="reviewer-name">
                      {review.reviewerName || 'Anonymous'}
                    </div>
                  )}
                  {settings.showDate && (
                    <div className="review-date">
                      {formatDate(review.googleCreatedAt)}
                    </div>
                  )}
                </div>
              </div>
              {settings.showRating && (
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`star ${star <= review.starRating ? 'star-filled' : 'star-empty'}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              )}
              {review.comment && (
                <div className="review-text">{review.comment}</div>
              )}
              {settings.showReply && review.reviewReply && (
                <div className="review-reply">
                  <div className="reply-label">Response from {location.title}</div>
                  {review.reviewReply}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Review Link */}
        {settings.showReviewLink && settings.googleReviewUrl && (
          <a
            href={settings.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="review-link"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Leave us a review
          </a>
        )}

        {/* Badge */}
        {settings.showBadge && (
          <a
            href="https://localreviewresponder.com?ref=widget"
            target="_blank"
            rel="noopener noreferrer"
            className="badge"
          >
            Powered by Local Review Responder
          </a>
        )}
      </body>
    </html>
  );
}
