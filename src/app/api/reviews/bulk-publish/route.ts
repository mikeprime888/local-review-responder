import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/reviews/bulk-publish - Bulk publish/unpublish reviews
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { locationId, action, minStars, reviewIds } = body;

    // Validate input
    if (!locationId) {
      return NextResponse.json({ error: 'Location ID required' }, { status: 400 });
    }

    // Verify ownership of location
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: { userId: true },
    });

    if (!location || location.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let result;
    const now = new Date();

    switch (action) {
      case 'publish_all':
        // Publish all reviews for this location
        result = await prisma.review.updateMany({
          where: { locationId },
          data: {
            isPublished: true,
            publishedAt: now,
          },
        });
        break;

      case 'unpublish_all':
        // Unpublish all reviews for this location
        result = await prisma.review.updateMany({
          where: { locationId },
          data: {
            isPublished: false,
            publishedAt: null,
            isFeatured: false,
          },
        });
        break;

      case 'publish_by_stars':
        // Publish reviews with rating >= minStars
        if (!minStars || minStars < 1 || minStars > 5) {
          return NextResponse.json({ error: 'Invalid minStars (1-5)' }, { status: 400 });
        }
        result = await prisma.review.updateMany({
          where: {
            locationId,
            starRating: { gte: minStars },
          },
          data: {
            isPublished: true,
            publishedAt: now,
          },
        });
        break;

      case 'publish_selected':
        // Publish specific reviews by ID
        if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
          return NextResponse.json({ error: 'Review IDs required' }, { status: 400 });
        }
        result = await prisma.review.updateMany({
          where: {
            id: { in: reviewIds },
            locationId, // Ensure they belong to this location
          },
          data: {
            isPublished: true,
            publishedAt: now,
          },
        });
        break;

      case 'unpublish_selected':
        // Unpublish specific reviews by ID
        if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
          return NextResponse.json({ error: 'Review IDs required' }, { status: 400 });
        }
        result = await prisma.review.updateMany({
          where: {
            id: { in: reviewIds },
            locationId,
          },
          data: {
            isPublished: false,
            publishedAt: null,
            isFeatured: false,
          },
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('Bulk publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
