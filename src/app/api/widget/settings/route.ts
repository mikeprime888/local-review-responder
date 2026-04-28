import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/widget/settings?locationId=xxx - Fetch widget settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
    }

    // Verify the user owns this location
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location || location.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const settings = await prisma.widgetSettings.findUnique({
      where: { locationId },
    });

    if (!settings) {
      // Return defaults
      return NextResponse.json({
        settings: {
          layout: 'carousel',
          theme: 'light',
          accentColor: '#4285F4',
          showName: true,
          showDate: true,
          showBadge: true,
          showHeaderBar: true,
          showWriteReviewButton: true,
          maxReviews: 6,
          limitReviews: true,
          minRating: 0,
        },
      });
    }

    // Map DB field names to frontend field names
    return NextResponse.json({
      settings: {
        layout: settings.layout,
        theme: settings.theme,
        accentColor: settings.accentColor,
        showName: settings.showName,
        showDate: settings.showDate,
        showBadge: settings.showBadge,
        showHeaderBar: settings.showHeaderBar,
        showWriteReviewButton: settings.showWriteReviewButton,
        maxReviews: settings.maxReviews,
        limitReviews: settings.limitReviews,
        minRating: settings.minStars, // DB: minStars → Frontend: minRating
      },
    });
  } catch (error: any) {
    console.error('Widget settings fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/widget/settings - Save widget settings for a location
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { locationId, layout, theme, accentColor, maxReviews, minRating, limitReviews, showDate, showName, showBadge, showHeaderBar, showWriteReviewButton } = body;

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
    }

    // Verify the user owns this location
    const location = await prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location || location.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Map frontend minRating → DB minStars
    const minStars = minRating ?? 0;

    // Upsert widget settings
    const settings = await prisma.widgetSettings.upsert({
      where: { locationId },
      create: {
        locationId,
        layout: layout || 'carousel',
        theme: theme || 'light',
        accentColor: accentColor || '#4285F4',
        maxReviews: maxReviews || 6,
        limitReviews: limitReviews ?? true,
        minStars,
        showDate: showDate ?? true,
        showName: showName ?? true,
        showBadge: showBadge ?? true,
        showHeaderBar: showHeaderBar ?? true,
        showWriteReviewButton: showWriteReviewButton ?? true,
      },
      update: {
        layout,
        theme,
        accentColor,
        maxReviews,
        limitReviews,
        minStars,
        showDate,
        showName,
        showBadge,
        showHeaderBar,
        showWriteReviewButton,
      },
    });

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Widget settings save error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}
