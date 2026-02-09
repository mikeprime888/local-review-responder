import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getValidAccessToken } from '@/lib/auth';
import { listLocations, listAllLocations, extractAccountId, extractLocationId } from '@/lib/google-business';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/google/locations
 * 
 * Query params:
 *   ?accountId=123  - Fetch locations for a specific account
 *   ?sync=true      - Sync locations from Google to database
 *   (no params)     - Return locations from database
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');
    const sync = searchParams.get('sync') === 'true';

    // If sync requested, fetch from Google and save to database
    if (sync) {
      const accessToken = await getValidAccessToken(session.user.id);
      
      let googleLocations;
      
      if (accountId) {
        // Fetch locations for a specific account
        googleLocations = await listLocations(accountId, accessToken);
      } else {
        // Fetch ALL locations across all accounts
        googleLocations = await listAllLocations(accessToken);
      }
            console.log('Google returned locations:', googleLocations.length, googleLocations.map(l => l.title));

      // We also need to know which account each location belongs to
      // If using wildcard, we need to fetch accounts first to map them
      const { listAccounts, extractAccountId: extractAccId } = await import('@/lib/google-business');
      const accounts = await listAccounts(accessToken);

      // For each location, determine its account and upsert into database
      const syncedLocations = [];

      for (const loc of googleLocations) {
        const locId = extractLocationId(loc.name);
        
        // Format address
        const addr = loc.storefrontAddress;
        const formattedAddress = addr
          ? [
              ...(addr.addressLines || []),
              addr.locality,
              addr.administrativeArea,
              addr.postalCode,
            ]
              .filter(Boolean)
              .join(', ')
          : null;

        // For now, if accountId was provided, use it. 
        // Otherwise we need to determine the account from the location's parent
        // The location name from wildcard requests doesn't include the account
        // So we'll try to match or use a default approach
        let resolvedAccountId = accountId;

        if (!resolvedAccountId && accounts.length > 0) {
          // Try to find which account this location belongs to by testing each
          // For now, use the first account - we'll refine this when syncing per-account
          resolvedAccountId = extractAccId(accounts[0].name);
        }

        if (!resolvedAccountId) continue;

        // Find the account name
        const accountObj = accounts.find(
          (a) => extractAccId(a.name) === resolvedAccountId
        );

        const synced = await prisma.location.upsert({
          where: {
            userId_googleAccountId_locationId: {
              userId: session.user.id,
              googleAccountId: resolvedAccountId,
              locationId: locId,
            },
          },
          update: {
            title: loc.title,
            address: formattedAddress,
            phone: loc.phoneNumbers?.primaryPhone || null,
            website: loc.websiteUri || null,
            mapsUri: loc.metadata?.mapsUri || null,
            googleAccountName: accountObj?.accountName || null,
          },
          create: {
            userId: session.user.id,
            googleAccountId: resolvedAccountId,
            googleAccountName: accountObj?.accountName || null,
            locationId: locId,
            title: loc.title,
            address: formattedAddress,
            phone: loc.phoneNumbers?.primaryPhone || null,
            website: loc.websiteUri || null,
            mapsUri: loc.metadata?.mapsUri || null,
          },
        });

        syncedLocations.push(synced);
      }

      return NextResponse.json({
        locations: syncedLocations,
        synced: syncedLocations.length,
        message: `Synced ${syncedLocations.length} locations from Google`,
      });
    }

    // Default: return locations from database
    const locations = await prisma.location.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: { reviews: true },
        },
      },
      orderBy: { title: 'asc' },
    });

    return NextResponse.json({ locations });
  } catch (error: any) {
    console.error('Error with locations:', error);

    if (error.message === 'GOOGLE_AUTH_EXPIRED') {
      return NextResponse.json(
        { error: 'Google authentication expired. Please sign out and sign in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to process locations' },
      { status: 500 }
    );
  }
}
