import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth';
import { listAllReviews, starRatingToNumber, extractReviewId } from '@/lib/google-business';
import { prisma } from '@/lib/prisma';
import { sendEmail, getNewReviewsEmailHtml } from '@/lib/email';

/**
 * GET /api/cron/sync-reviews
 *
 * Runs on a schedule (Vercel Cron) to sync reviews for all locations
 * with active subscriptions. Sends email notifications for new reviews.
 *
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Cron: Starting nightly review sync...');

  try {
    // Get all locations with active subscriptions (active or trialing)
    const activeLocations = await prisma.location.findMany({
      where: {
        isActive: true,
        subscription: {
          status: {
            in: ['active', 'trialing'],
          },
        },
      },
      include: {
        subscription: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`Cron: Found ${activeLocations.length} active locations to sync`);

    if (activeLocations.length === 0) {
      return NextResponse.json({
        message: 'No active locations to sync',
        synced: 0,
      });
    }

    // Group locations by user to minimize token fetches
    const locationsByUser = new Map<string, typeof activeLocations>();
    for (const loc of activeLocations) {
      const userId = loc.userId;
      if (!locationsByUser.has(userId)) {
        locationsByUser.set(userId, []);
      }
      locationsByUser.get(userId)!.push(loc);
    }

    const results: Array<{
      location: string;
      newReviews: number;
      totalSynced: number;
      error?: string;
    }> = [];

    // Process each user's locations
    for (const [userId, locations] of Array.from(locationsByUser.entries())) {
      let accessToken: string;
      try {
        accessToken = await getValidAccessToken(userId);
      } catch (tokenError: any) {
        console.error(`Cron: Failed to get access token for user ${userId}:`, tokenError.message);
        for (const loc of locations) {
          results.push({
            location: loc.title,
            newReviews: 0,
            totalSynced: 0,
            error: 'Failed to get Google access token',
          });
        }
        continue;
      }

      // Track new reviews per user for email notification
      const userNewReviews: Array<{
        locationTitle: string;
        reviewerName: string;
        starRating: number;
        comment: string | null;
      }> = [];

      for (const loc of locations) {
        try {
          const result = await listAllReviews(
            loc.googleAccountId,
            loc.locationId,
            accessToken
          );

          let synced = 0;
          let newCount = 0;

          for (const review of result.reviews) {
            const reviewId = extractReviewId(review.name);

            // Check if review already exists
            const existing = await prisma.review.findUnique({
              where: {
                locationId_googleReviewId: {
                  locationId: loc.id,
                  googleReviewId: reviewId,
                },
              },
            });

            const isNew = !existing;

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
                isPublished: true,
                publishedAt: new Date(),
              },
            });

            synced++;
            if (isNew) {
              newCount++;
              userNewReviews.push({
                locationTitle: loc.title,
                reviewerName: review.reviewer.displayName || 'Anonymous',
                starRating: starRatingToNumber(review.starRating),
                comment: review.comment || null,
              });
            }
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

          results.push({
            location: loc.title,
            newReviews: newCount,
            totalSynced: synced,
          });

          console.log(`Cron: ${loc.title} — ${synced} synced, ${newCount} new`);
        } catch (locError: any) {
          console.error(`Cron: Error syncing ${loc.title}:`, locError.message);
          results.push({
            location: loc.title,
            newReviews: 0,
            totalSynced: 0,
            error: locError.message,
          });
        }
      }

      // Send email notification if there are new reviews for this user
      if (userNewReviews.length > 0 && locations[0].user.email) {
        try {
          const html = getNewReviewsEmailHtml(
            locations[0].user.name || undefined,
            userNewReviews
          );

          await sendEmail({
            to: locations[0].user.email,
            subject: `📬 ${userNewReviews.length} new review${userNewReviews.length > 1 ? 's' : ''} on Local Review Responder`,
            html,
            toName: locations[0].user.name || undefined,
          });

          console.log(`Cron: Sent new review notification to ${locations[0].user.email} (${userNewReviews.length} new reviews)`);
        } catch (emailError: any) {
          console.error(`Cron: Failed to send email to ${locations[0].user.email}:`, emailError.message);
        }
      }
    }

    const totalNew = results.reduce((sum, r) => sum + r.newReviews, 0);
    const totalSynced = results.reduce((sum, r) => sum + r.totalSynced, 0);

    console.log(`Cron: Complete — ${totalSynced} reviews synced, ${totalNew} new across ${activeLocations.length} locations`);

    return NextResponse.json({
      message: `Synced ${totalSynced} reviews across ${activeLocations.length} locations (${totalNew} new)`,
      totalSynced,
      totalNew,
      locationsProcessed: activeLocations.length,
      results,
    });
  } catch (error: any) {
    console.error('Cron: Fatal error:', error);
    return NextResponse.json(
      { error: error.message || 'Cron sync failed' },
      { status: 500 }
    );
  }
}
