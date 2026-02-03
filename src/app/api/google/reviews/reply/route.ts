import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getValidAccessToken } from '@/lib/auth';
import { replyToReview, deleteReply } from '@/lib/google-business';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/google/reviews/reply
 * 
 * Body: { reviewDbId: string, comment: string }
 * 
 * Posts a reply to a Google review and updates the database.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewDbId, comment } = body;

    if (!reviewDbId || !comment?.trim()) {
      return NextResponse.json(
        { error: 'Missing reviewDbId or comment' },
        { status: 400 }
      );
    }

    // Get the review and its location from database
    const review = await prisma.review.findUnique({
      where: { id: reviewDbId },
      include: {
        location: {
          select: {
            userId: true,
            googleAccountId: true,
            locationId: true,
            title: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Verify ownership
    if (review.location.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Post reply to Google
    const accessToken = await getValidAccessToken(session.user.id);
    
    const result = await replyToReview(
      review.location.googleAccountId,
      review.location.locationId,
      review.googleReviewId,
      comment.trim(),
      accessToken
    );

    // Update review in database
    const updated = await prisma.review.update({
      where: { id: reviewDbId },
      data: {
        reviewReply: comment.trim(),
        replyTime: result.updateTime ? new Date(result.updateTime) : new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      review: updated,
      message: `Reply posted to review on "${review.location.title}"`,
    });
  } catch (error: any) {
    console.error('Error posting reply:', error);

    if (error.message === 'GOOGLE_AUTH_EXPIRED') {
      return NextResponse.json(
        { error: 'Google authentication expired. Please sign out and sign in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to post reply' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/google/reviews/reply
 * 
 * Body: { reviewDbId: string }
 * 
 * Deletes a reply from a Google review and updates the database.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { reviewDbId } = body;

    if (!reviewDbId) {
      return NextResponse.json(
        { error: 'Missing reviewDbId' },
        { status: 400 }
      );
    }

    // Get the review from database
    const review = await prisma.review.findUnique({
      where: { id: reviewDbId },
      include: {
        location: {
          select: {
            userId: true,
            googleAccountId: true,
            locationId: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.location.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete reply from Google
    const accessToken = await getValidAccessToken(session.user.id);

    await deleteReply(
      review.location.googleAccountId,
      review.location.locationId,
      review.googleReviewId,
      accessToken
    );

    // Update database
    const updated = await prisma.review.update({
      where: { id: reviewDbId },
      data: {
        reviewReply: null,
        replyTime: null,
      },
    });

    return NextResponse.json({
      success: true,
      review: updated,
      message: 'Reply deleted',
    });
  } catch (error: any) {
    console.error('Error deleting reply:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to delete reply' },
      { status: 500 }
    );
  }
}
