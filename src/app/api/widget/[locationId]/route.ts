import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/widget/[locationId] - Public endpoint for embed widget
export async function GET(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const { locationId } = params;

    // Find the location and verify it has an active subscription
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        subscription: true,
        widgetSettings: true,
      },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Check for active subscription
    const hasActiveSubscription =
      location.subscription &&
      ['active', 'trialing'].includes(location.subscription.status);

    if (!hasActiveSubscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 403 });
    }

    // Get widget settings (use defaults if none configured)
    const settings = location.widgetSettings || {
      layout: 'carousel',
      theme: 'light',
      accentColor: '#4F46E5',
      maxReviews: 10,
      minStars: 4,
      showDate: true,
      showName: true,
      showBadge: true,
    };

    // Fetch published reviews that meet the minimum star filter
    const reviews = await prisma.review.findMany({
      where: {
        locationId,
        isPublished: true,
        starRating: { gte: settings.minStars },
      },
      select: {
        id: true,
        reviewerName: true,
        reviewerPhoto: true,
        starRating: true,
        comment: true,
        googleCreatedAt: true,
      },
      orderBy: { googleCreatedAt: 'desc' },
      take: settings.maxReviews,
    });

    // Set cache headers (5 minute cache)
    const response = NextResponse.json({
      location: {
        title: location.title,
        averageRating: location.averageRating,
        totalReviews: location.totalReviews,
        mapsUri: location.mapsUri,
      },
      settings: {
        layout: settings.layout,
        theme: settings.theme,
        accentColor: settings.accentColor,
        showDate: settings.showDate,
        showName: settings.showName,
        showBadge: settings.showBadge,
      },
      reviews,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    response.headers.set('Access-Control-Allow-Origin', '*');

    return response;
  } catch (error: any) {
    console.error('Widget API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch widget data' },
      { status: 500 }
    );
  }
}
