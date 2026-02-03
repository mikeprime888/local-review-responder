import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getValidAccessToken } from '@/lib/auth';
import { listAllLocations } from '@/lib/google-business';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/subscriptions
 * 
 * Returns user's locations with subscription status
 * Query params:
 *   - available=true: Only show locations without active subscriptions (for adding new)
 *   - active=true: Only show active subscribed locations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showAvailable = searchParams.get('available') === 'true';
    const showActive = searchParams.get('active') === 'true';
    const syncFromGoogle = searchParams.get('sync') === 'true';

    // If sync requested, fetch fresh data from Google
    if (syncFromGoogle) {
      const accessToken = await getValidAccessToken(session.user.id);
      
      if (accessToken) {
        const googleLocations = await listAllLocations(accessToken);
        
        // Upsert all locations from Google
        for (const loc of googleLocations) {
          await prisma.location.upsert({
            where: {
              userId_googleAccountId_locationId: {
                userId: session.user.id,
                googleAccountId: loc.accountId,
                locationId: loc.locationId,
              },
            },
            create: {
              userId: session.user.id,
              googleAccountId: loc.accountId,
              googleAccountName: loc.accountName,
              locationId: loc.locationId,
              title: loc.title,
              address: loc.address,
              phone: loc.phone,
              website: loc.website,
              mapsUri: loc.mapsUri,
              averageRating: loc.averageRating,
              totalReviews: loc.totalReviews,
              isActive: false, // Not active until subscribed
            },
            update: {
              googleAccountName: loc.accountName,
              title: loc.title,
              address: loc.address,
              phone: loc.phone,
              website: loc.website,
              mapsUri: loc.mapsUri,
              averageRating: loc.averageRating,
              totalReviews: loc.totalReviews,
            },
          });
        }
      }
    }

    // Build query based on filters
    let whereClause: any = { userId: session.user.id };

    if (showAvailable) {
      // Locations without active subscriptions
      whereClause.OR = [
        { subscription: null },
        { subscription: { status: { notIn: ['active', 'trialing'] } } },
      ];
    } else if (showActive) {
      // Only active subscribed locations
      whereClause.isActive = true;
    }

    const locations = await prisma.location.findMany({
      where: whereClause,
      include: {
        subscription: true,
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({
      locations: locations.map(loc => ({
        id: loc.id,
        googleAccountId: loc.googleAccountId,
        googleAccountName: loc.googleAccountName,
        locationId: loc.locationId,
        title: loc.title,
        address: loc.address,
        phone: loc.phone,
        website: loc.website,
        mapsUri: loc.mapsUri,
        averageRating: loc.averageRating,
        totalReviews: loc.totalReviews,
        isActive: loc.isActive,
        subscription: loc.subscription ? {
          id: loc.subscription.id,
          status: loc.subscription.status,
          currentPeriodEnd: loc.subscription.currentPeriodEnd,
          cancelAtPeriodEnd: loc.subscription.cancelAtPeriodEnd,
          trialEnd: loc.subscription.trialEnd,
        } : null,
      })),
    });
  } catch (error: any) {
    console.error('Subscriptions API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
