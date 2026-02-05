import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint - no authentication required
// GET /api/widget/[locationId]
// Returns published reviews and widget settings for embedding

export async function GET(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const { locationId } = params;

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      );
    }

    // Get the location with its subscription status
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        subscription: {
          select: {
            status: true,
          },
        },
        widgetSettings: true,
      },
    });

    // Check if location exists
    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if location has an active subscription
    const hasActiveSubscription = 
      location.subscription?.status === 'active' || 
      location.subscription?.status === 'trialing';

    if (!hasActiveSubscription) {
      // Return empty response - widget gracefully disappears
      return NextResponse.json({
        reviews: [],
        settings: null,
        summary: null,
        active: false,
      });
    }

    // Get widget settings (use defaults if not configured)
    const settings = location.widgetSettings || {
      layout: 'list',
      theme: 'light',
      accentColor: '#3B82F6',
      maxReviews: 10,
      minStars: 1,
      showDate: true,
      showReviewerName: true,
      showReviewerPhoto: true,
      showRating: true,
      showReply: false,
      showSummary: true,
      showBadge: true,
      showReviewLink: false,
      googleReviewUrl: null,
    };

    // Fetch published reviews
    const reviews = await prisma.review.findMany({
      where: {
        locationId: locationId,
        isPublished: true,
        starRating: {
          gte: settings.minStars,
        },
      },
      select: {
        id: true,
        reviewerName: settings.showReviewerName,
        reviewerPhoto: settings.showReviewerPhoto,
        starRating: true,
        comment: true,
        reviewReply: settings.showReply,
        googleCreatedAt: settings.showDate,
        isFeatured: true,
      },
      orderBy: [
        { isFeatured: 'desc' }, // Featured reviews first
        { googleCreatedAt: 'desc' }, // Then by date
      ],
      take: settings.maxReviews,
    });

    // Calculate summary stats
    const allPublishedReviews = await prisma.review.findMany({
      where: {
        locationId: locationId,
        isPublished: true,
      },
      select: {
        starRating: true,
      },
    });

    const totalReviews = allPublishedReviews.length;
    const averageRating = totalReviews > 0
      ? allPublishedReviews.reduce((sum, r) => sum + r.starRating, 0) / totalReviews
      : 0;

    // Star distribution for summary bar
    const starDistribution = {
      5: allPublishedReviews.filter(r => r.starRating === 5).length,
      4: allPublishedReviews.filter(r => r.starRating === 4).length,
      3: allPublishedReviews.filter(r => r.starRating === 3).length,
      2: allPublishedReviews.filter(r => r.starRating === 2).length,
      1: allPublishedReviews.filter(r => r.starRating === 1).length,
    };

    // Set cache headers - cache for 5 minutes
    const response = NextResponse.json({
      reviews: reviews.map(review => ({
        id: review.id,
        reviewerName: review.reviewerName || 'Anonymous',
        reviewerPhoto: review.reviewerPhoto,
        starRating: review.starRating,
        comment: review.comment,
        reply: review.reviewReply,
        date: review.googleCreatedAt,
        isFeatured: review.isFeatured,
      })),
      settings: {
        layout: settings.layout,
        theme: settings.theme,
        accentColor: settings.accentColor,
        showDate: settings.showDate,
        showReviewerName: settings.showReviewerName,
        showReviewerPhoto: settings.showReviewerPhoto,
        showRating: settings.showRating,
        showReply: settings.showReply,
        showSummary: settings.showSummary,
        showBadge: settings.showBadge,
        showReviewLink: settings.showReviewLink,
        googleReviewUrl: settings.googleReviewUrl,
      },
      summary: settings.showSummary ? {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        starDistribution,
        businessName: location.title,
      } : null,
      active: true,
    });

    // Cache for 5 minutes on CDN, 1 minute on browser
    response.headers.set('Cache-Control', 'public, s-maxage=300, max-age=60');
    
    return response;
  } catch (error) {
    console.error('Widget API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
