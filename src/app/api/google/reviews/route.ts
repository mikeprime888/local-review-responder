import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getValidAccessToken } from '@/lib/auth';
import { listAllReviews, starRatingToNumber, extractReviewId } from '@/lib/google-business';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/google/reviews
 * 
 * Query params:
 *   ?locationId=xxx        - Filter reviews by our DB location ID
 *   ?sync=true             - Fetch fresh reviews from Google
 *   ?rating=5              - Filter by star rating (1-5)
 *   ?replied=true|false    - Filter by reply status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const locationDbId = searchParams.get('locationId');
    const sync = searchParams.get('sync') === 'true';
    const ratingFilter = searchParams.get('rating');
    const repliedFilter = searchParams.get('replied');

    // If sync requested, fetch from Google
    if (sync) {
      const accessToken = await getValidAccessToken(session.user.id);

      // Get locations to sync - either specific or all
      const whereClause: any = { userId: session.user.id };
      if (locationDbId) {
        whereClause.id = locationDbId;
      }

      const locations = await prisma.location.findMany({
        where: whereClause,
      });

      if (locations.length === 0) {
        return NextResponse.json(
          { error: 'No locations found. Please sync locations first.' },
          { status: 404 }
        );
      }

      let totalSynced = 0;
      const syncResults = [];

      for (const loc of locations) {
        try {
          const result = await listAllReviews(
            loc.googleAccountId,
            loc.locationId,
            accessToken
          );

          // Upsert each review into database
          let locationSynced = 0;

          for (const review of result.reviews) {
            const reviewId = extractReviewId(review.name);

            await prisma.review.upsert({
              where: {
                locationId_googleReviewId: {
                  locationId: loc.id,
                  googleReviewId: reviewId,
                },
              },
              update: {
                reviewerName: review.reviewer.displayName || 'Anonymous',
                reviewerPhoto: review.reviewer.profilePhotoUrl || null,
                starRating: starRatingToNumber(review.starRating),
                comment: review.comment || null,
                reviewReply: review.reviewReply?.comment || null,
                replyTime: review.reviewReply?.updateTime
                  ? new Date(review.reviewReply.updateTime)
                  : null,
                googleUpdatedAt: new Date(review.updateTime),
              },
              create: {
                locationId: loc.id,
                googleReviewId: reviewId,
                reviewerName: review.reviewer.displayName || 'Anonymous',
                reviewerPhoto: review.reviewer.profilePhotoUrl || null,
                starRating: starRatingToNumber(review.starRating),
                comment: review.comment || null,
                reviewReply: review.reviewReply?.comment || null,
                replyTime: review.reviewReply?.updateTime
                  ? new Date(review.reviewReply.updateTime)
                  : null,
                googleCreatedAt: new Date(review.createTime),
                googleUpdatedAt: new Date(review.updateTime),
              },
            });

            locationSynced++;
          }

          // Update location stats
          await prisma.location.update({
            where: { id: loc.id },
            data: {
              averageRating: result.averageRating || null,
              totalReviews: result.totalReviewCount || result.reviews.length,
              lastSyncedAt: new Date(),
            },
          });

          totalSynced += locationSynced;
          syncResults.push({
            location: loc.title,
            reviewsSynced: locationSynced,
            averageRating: result.averageRating,
            totalReviews: result.totalReviewCount,
          });
        } catch (locError: any) {
          console.error(`Error syncing reviews for ${loc.title}:`, locError);
          syncResults.push({
            location: loc.title,
            error: locError.message,
          });
        }
      }

      return NextResponse.json({
        synced: totalSynced,
        results: syncResults,
        message: `Synced ${totalSynced} reviews across ${locations.length} locations`,
      });
    }

    // Default: return reviews from database with filters
    const whereClause: any = {
      location: {
        userId: session.user.id,
      },
    };

    if (locationDbId) {
      whereClause.locationId = locationDbId;
    }

    if (ratingFilter) {
      whereClause.starRating = parseInt(ratingFilter);
    }

    if (repliedFilter !== null && repliedFilter !== undefined) {
      if (repliedFilter === 'true') {
        whereClause.reviewReply = { not: null };
      } else if (repliedFilter === 'false') {
        whereClause.reviewReply = null;
      }
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        location: {
          select: {
            title: true,
            googleAccountId: true,
            locationId: true,
          },
        },
      },
      orderBy: { googleCreatedAt: 'desc' },
    });

    // Also get summary stats
    const stats = await prisma.review.groupBy({
      by: ['starRating'],
      where: {
        location: { userId: session.user.id },
        ...(locationDbId ? { locationId: locationDbId } : {}),
      },
      _count: true,
    });

    const totalReviews = stats.reduce((sum, s) => sum + s._count, 0);
    const weightedSum = stats.reduce((sum, s) => sum + s.starRating * s._count, 0);
    const averageRating = totalReviews > 0 ? weightedSum / totalReviews : 0;
    const unreplied = await prisma.review.count({
      where: {
        location: { userId: session.user.id },
        reviewReply: null,
        ...(locationDbId ? { locationId: locationDbId } : {}),
      },
    });

    return NextResponse.json({
      reviews,
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingBreakdown: stats.reduce(
          (acc, s) => ({ ...acc, [s.starRating]: s._count }),
          {} as Record<number, number>
        ),
        unreplied,
      },
    });
  } catch (error: any) {
    console.error('Error with reviews:', error);

    if (error.message === 'GOOGLE_AUTH_EXPIRED') {
      return NextResponse.json(
        { error: 'Google authentication expired. Please sign out and sign in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process reviews' },
      { status: 500 }
    );
  }
}
