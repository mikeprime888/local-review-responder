import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getValidAccessToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/locations
 *
 * Lists the signed-in user's locations.
 *   ?active=true     only active locations
 *   ?available=true  only inactive locations (candidates to add)
 *   ?sync=true       refresh locations from Google first
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

    // If sync requested, fetch fresh data from Google using per-account iteration
    // Note: listAllLocations() uses wildcard accounts/-/locations which misses
    // LOCATION_GROUP account types. We iterate each account individually instead.
    if (syncFromGoogle) {
      const accessToken = await getValidAccessToken(session.user.id);

      if (accessToken) {
        const { listAccounts, listLocations, extractAccountId, extractLocationId } = await import('@/lib/google-business');
        const accounts = await listAccounts(accessToken);

        console.log(`Syncing locations across ${accounts.length} Google accounts`);

        for (const account of accounts) {
          const accId = extractAccountId(account.name);
          try {
            const locs = await listLocations(accId, accessToken);
            console.log(`Account "${account.accountName}" (${accId}) returned ${locs.length} locations`);

            for (const loc of locs) {
              const locId = extractLocationId(loc.name);

              const addr = loc.storefrontAddress;
              const formattedAddress = addr
                ? [...(addr.addressLines || []), addr.locality, addr.administrativeArea, addr.postalCode]
                    .filter(Boolean).join(', ')
                : null;

              await prisma.location.upsert({
                where: {
                  userId_googleAccountId_locationId: {
                    userId: session.user.id,
                    googleAccountId: accId,
                    locationId: locId,
                  },
                },
                create: {
                  userId: session.user.id,
                  googleAccountId: accId,
                  googleAccountName: account.accountName || null,
                  locationId: locId,
                  title: loc.title || 'Unknown',
                  address: formattedAddress,
                  phone: loc.phoneNumbers?.primaryPhone || null,
                  website: loc.websiteUri || null,
                  mapsUri: loc.metadata?.mapsUri || null,
                  isActive: false,
                },
                update: {
                  googleAccountName: account.accountName || null,
                  title: loc.title || 'Unknown',
                  address: formattedAddress,
                  phone: loc.phoneNumbers?.primaryPhone || null,
                  website: loc.websiteUri || null,
                  mapsUri: loc.metadata?.mapsUri || null,
                },
              });
            }
          } catch (err: any) {
            console.error(`Error syncing account "${account.accountName}" (${accId}):`, err.message);
          }
        }
      }
    }

    // Build query based on filters
    let whereClause: any = { userId: session.user.id };

    if (showAvailable) {
      whereClause.isActive = false;
    } else if (showActive) {
      whereClause.isActive = true;
    }

    const locations = await prisma.location.findMany({
      where: whereClause,
      orderBy: { title: 'asc' },
    });

    // Fetch user privilege flags from DB (server-side, no hydration issues)
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    return NextResponse.json({
      isAdmin: dbUser?.isAdmin || false,
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
      })),
    });
  } catch (error: any) {
    console.error('Locations API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
