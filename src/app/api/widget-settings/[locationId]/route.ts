import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/widget-settings/[locationId] - Get widget settings
export async function GET(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId } = params;

    // Verify ownership
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      include: {
        widgetSettings: true,
      },
    });

    if (!location || location.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Return existing settings or defaults
    const settings = location.widgetSettings || {
      layout: 'list',
      theme: 'light',
      accentColor: '#3B82F6',
      maxReviews: 10,
      minStars: 1,
      autoPublish: false,
      autoPublishStars: 4,
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

    // Generate embed code
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://local-review-responder.vercel.app';
    const embedCode = `<div id="lrr-reviews" data-location="${locationId}"></div>
<script src="${baseUrl}/widget.js" async></script>`;

    const iframeCode = `<iframe 
  src="${baseUrl}/embed/${locationId}" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: none; max-width: 100%;">
</iframe>`;

    return NextResponse.json({
      settings,
      embedCode,
      iframeCode,
      locationId,
      businessName: location.title,
    });
  } catch (error) {
    console.error('Widget settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/widget-settings/[locationId] - Update widget settings
export async function PUT(
  request: NextRequest,
  { params }: { params: { locationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId } = params;
    const body = await request.json();

    // Verify ownership
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { userId: true },
    });

    if (!location || location.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate settings
    const validLayouts = ['list', 'grid', 'carousel'];
    const validThemes = ['light', 'dark', 'auto'];

    const settings = {
      layout: validLayouts.includes(body.layout) ? body.layout : 'list',
      theme: validThemes.includes(body.theme) ? body.theme : 'light',
      accentColor: /^#[0-9A-Fa-f]{6}$/.test(body.accentColor) ? body.accentColor : '#3B82F6',
      maxReviews: Math.min(Math.max(parseInt(body.maxReviews) || 10, 1), 50),
      minStars: Math.min(Math.max(parseInt(body.minStars) || 1, 1), 5),
      autoPublish: Boolean(body.autoPublish),
      autoPublishStars: Math.min(Math.max(parseInt(body.autoPublishStars) || 4, 1), 5),
      showDate: body.showDate !== false,
      showReviewerName: body.showReviewerName !== false,
      showReviewerPhoto: body.showReviewerPhoto !== false,
      showRating: body.showRating !== false,
      showReply: Boolean(body.showReply),
      showSummary: body.showSummary !== false,
      showBadge: body.showBadge !== false,
      showReviewLink: Boolean(body.showReviewLink),
      googleReviewUrl: body.googleReviewUrl || null,
    };

    // Upsert settings
    const updatedSettings = await prisma.widgetSettings.upsert({
      where: { locationId },
      update: settings,
      create: {
        locationId,
        ...settings,
      },
    });

    // If autoPublish is enabled, publish matching reviews
    if (settings.autoPublish) {
      await prisma.review.updateMany({
        where: {
          locationId,
          starRating: { gte: settings.autoPublishStars },
          isPublished: false,
        },
        data: {
          isPublished: true,
          publishedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Widget settings PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
