import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// PUT /api/widget/settings - Save widget settings for a location
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { locationId, layout, theme, accentColor, maxReviews, minStars, showDate, showName, showBadge } = body;

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

    // Upsert widget settings
    const settings = await prisma.widgetSettings.upsert({
      where: { locationId },
      create: {
        locationId,
        layout: layout || 'carousel',
        theme: theme || 'light',
        accentColor: accentColor || '#4F46E5',
        maxReviews: maxReviews || 10,
        minStars: minStars || 4,
        showDate: showDate ?? true,
        showName: showName ?? true,
        showBadge: showBadge ?? true,
      },
      update: {
        layout,
        theme,
        accentColor,
        maxReviews,
        minStars,
        showDate,
        showName,
        showBadge,
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
