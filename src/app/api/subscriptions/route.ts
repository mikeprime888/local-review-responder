import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getValidAccessToken } from '@/lib/auth';
import { listAllLocations } from '@/lib/google-business';
import { prisma } from '@/lib/prisma';

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
                googleAccountId: (loc as any).accountId || '',
                locationId: (loc as any).locationId || '',
              },
            },
            create: {
              userId: session.user.id,
              googleAccountId: (loc as any).accountId || '',
              googleAccountName: (loc as any).accountName || null,
              locationId: (loc as any).locationId || '',
              title: (loc as any).title || 'Unknown',
              address: (loc as any).address || null,
              phone: (loc as any).phone || null,
              website: (loc as any).website || null,
              mapsUri: (loc as any).mapsUri || null,
              averageRating: (loc as any).averageRating || null,
              totalReviews: (loc as any).totalReviews || 0,
              isActive: false,
            },
            update: {
              googleAccountName: (loc as any).accountName || null,
              title: (loc as any).title || 'Unknown',
              address: (loc as any).address || null,
              phone: (loc as any).phone || null,
              website: (loc as any).website || null,
              mapsUri: (loc as any).mapsUri || null,
              averageRating: (loc as any).averageRating || null,
              totalReviews: (loc as any).totalReviews || 0,
            },
          });
        }
      }
    }

    // Build query based on filters
    let whereClause: any = { userId: session.user.id };

    if (showAvailable) {
      whereClause.OR = [
        { subscription: null },
        { subscription: { status: { notIn: ['active', 'trialing'] } } },
      ];
    } else if (showActive) {
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
