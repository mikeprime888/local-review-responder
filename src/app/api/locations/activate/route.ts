import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getValidAccessToken } from '@/lib/auth';
import { listAllReviews, starRatingToNumber, extractReviewId } from '@/lib/google-business';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/locations/activate
 *
 * Activates a location directly for comped users, bypassing Stripe.
 *
 * Body: { locationId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!(session.user as any).isComped) {
      return NextResponse.json({ error: 'This endpoint is only available for comped accounts.' }, { status: 403 });
    }

    const body = await request.json();
    const { locationId } = body;

    if (!locationId) {
      return NextResponse.json({ error: 'Missing locationId' }, { status: 400 });
    }

    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId: session.user.id,
      },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 403 });
    }

    await prisma.location.update({
      where: { id: locationId },
      data: { isActive: true },
    });

    // Trigger review sync server-side so it completes regardless of navigation
    try {
      const accessToken = await getValidAccessToken(session.user.id);
      const result = await listAllReviews(
        location.googleAccountId,
        location.locationId,
        accessToken
      );

      for (const review of result.reviews) {
        const reviewId = extractReviewId(review.name);
        await prisma.review.upsert({
          where: {
            locationId_googleReviewId: {
              locationId: location.id,
              googleReviewId: reviewId,
            },
          },
          update: {
            reviewerName: review.reviewer.displayName || 'Anonymous',
            reviewerPhoto: review.reviewer.profilePhotoUrl || null,
            starRating: starRatingToNumber(review.starRating),
            comment: review.comment || null,
            reviewReply: review.reviewReply?.comment || null,
            replyTime: review.reviewReply?.updateTime ? new Date(review.reviewReply.updateTime) : null,
            googleUpdatedAt: new Date(review.updateTime),
          },
          create: {
            locationId: location.id,
            googleReviewId: reviewId,
            reviewerName: review.reviewer.displayName || 'Anonymous',
            reviewerPhoto: review.reviewer.profilePhotoUrl || null,
            starRating: starRatingToNumber(review.starRating),
            comment: review.comment || null,
            reviewReply: review.reviewReply?.comment || null,
            replyTime: review.reviewReply?.updateTime ? new Date(review.reviewReply.updateTime) : null,
            googleCreatedAt: new Date(review.createTime),
            googleUpdatedAt: new Date(review.updateTime),
            isPublished: true,
            publishedAt: new Date(),
          },
        });
      }

      await prisma.location.update({
        where: { id: location.id },
        data: {
          averageRating: result.averageRating || null,
          totalReviews: result.totalReviewCount || result.reviews.length,
          lastSyncedAt: new Date(),
        },
      });
    } catch (syncError: any) {
      console.error('Review sync error during activation:', syncError);
      // Don't fail activation if sync fails — location is active, user can sync manually
    }

    return NextResponse.json({ activated: true }, { status: 200 });
  } catch (error: any) {
    console.error('Activate location error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate location' },
      { status: 500 }
    );
  }
}
