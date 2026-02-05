import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/reviews/[reviewId]/publish - Toggle publish status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId } = params;
    const body = await request.json();
    const { isPublished, isFeatured } = body;

    // Get the review and verify ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        location: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.location.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update data
    const updateData: {
      isPublished?: boolean;
      publishedAt?: Date | null;
      isFeatured?: boolean;
    } = {};

    if (typeof isPublished === 'boolean') {
      updateData.isPublished = isPublished;
      updateData.publishedAt = isPublished ? new Date() : null;
    }

    if (typeof isFeatured === 'boolean') {
      updateData.isFeatured = isFeatured;
      // Auto-publish if featuring
      if (isFeatured && !review.isPublished) {
        updateData.isPublished = true;
        updateData.publishedAt = new Date();
      }
    }

    // Update the review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      review: {
        id: updatedReview.id,
        isPublished: updatedReview.isPublished,
        publishedAt: updatedReview.publishedAt,
        isFeatured: updatedReview.isFeatured,
      },
    });
  } catch (error) {
    console.error('Review publish error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
