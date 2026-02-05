import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/locations/[locationId]/reviews - Get all reviews for a location
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
      select: { userId: true, title: true },
    });

    if (!location || location.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get URL params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'published', 'unpublished', or null for all
    const minStars = searchParams.get('minStars');
    const sortBy = searchParams.get('sortBy') || 'googleCreatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Record<string, unknown> = { locationId };
    
    if (status === 'published') {
      where.isPublished = true;
    } else if (status === 'unpublished') {
      where.isPublished = false;
    }

    if (minStars) {
      where.starRating = { gte: parseInt(minStars) };
    }

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        googleReviewId: true,
        reviewerName: true,
        reviewerPhoto: true,
        starRating: true,
        comment: true,
        reviewReply: true,
        replyTime: true,
        googleCreatedAt: true,
        googleUpdatedAt: true,
        isPublished: true,
        publishedAt: true,
        isFeatured: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get stats
    const stats = await prisma.review.groupBy({
      by: ['isPublished'],
      where: { locationId },
      _count: true,
    });

    const publishedCount = stats.find((s) => s.isPublished)?._count || 0;
    const unpublishedCount = stats.find((s) => !s.isPublished)?._count || 0;

    const featuredCount = await prisma.review.count({
      where: { locationId, isFeatured: true },
    });

    return NextResponse.json({
      reviews,
      stats: {
        total: publishedCount + unpublishedCount,
        published: publishedCount,
        unpublished: unpublishedCount,
        featured: featuredCount,
      },
      locationName: location.title,
    });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
