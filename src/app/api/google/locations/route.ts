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

      // Always fetch accounts first - we need them for proper mapping
      const { listAccounts, extractAccountId: extractAccId } = await import('@/lib/google-business');
      const accounts = await listAccounts(accessToken);

      console.log('Google returned accounts:', accounts.length, accounts.map(a => ({
        name: a.name,
        accountName: a.accountName,
        type: a.type,
        role: a.role,
      })));

      let googleLocations: Array<{ location: any; accountId: string; accountName: string | null }> = [];

      if (accountId) {
        // Fetch locations for a specific account
        const locs = await listLocations(accountId, accessToken);
        const accountObj = accounts.find(a => extractAccId(a.name) === accountId);
        for (const loc of locs) {
          googleLocations.push({
            location: loc,
            accountId,
            accountName: accountObj?.accountName || null,
          });
        }
        console.log(`Account ${accountId} returned ${locs.length} locations`);
      } else {
        // Fetch locations for EACH account individually
        // This is more reliable than the wildcard endpoint (accounts/-/locations)
        // which can miss locations from certain account types
        for (const account of accounts) {
          const accId = extractAccId(account.name);
          try {
            const locs = await listLocations(accId, accessToken);
            console.log(`Account "${account.accountName}" (${accId}, type: ${account.type}) returned ${locs.length} locations:`, locs.map(l => l.title));
            for (const loc of locs) {
              googleLocations.push({
                location: loc,
                accountId: accId,
                accountName: account.accountName || null,
              });
            }
          } catch (accountError: any) {
            // Log but don't fail the entire sync if one account errors
            console.error(`Error fetching locations for account "${account.accountName}" (${accId}):`, accountError.message);
          }
        }
      }

      console.log(`Total locations found across all accounts: ${googleLocations.length}`);

      // For each location, upsert into database
      const syncedLocations = [];

      for (const { location: loc, accountId: resolvedAccountId, accountName } of googleLocations) {
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

        try {
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
              googleAccountName: accountName,
            },
            create: {
              userId: session.user.id,
              googleAccountId: resolvedAccountId,
              googleAccountName: accountName,
              locationId: locId,
              title: loc.title,
              address: formattedAddress,
              phone: loc.phoneNumbers?.primaryPhone || null,
              website: loc.websiteUri || null,
              mapsUri: loc.metadata?.mapsUri || null,
            },
          });

          syncedLocations.push(synced);
        } catch (upsertError: any) {
          console.error(`Error upserting location "${loc.title}" (${locId}):`, upsertError.message);
        }
      }

      console.log(`Successfully synced ${syncedLocations.length} of ${googleLocations.length} locations to database`);

      return NextResponse.json({
        locations: syncedLocations,
        synced: syncedLocations.length,
        totalFound: googleLocations.length,
        accountsChecked: accounts.length,
        message: `Synced ${syncedLocations.length} locations from ${accounts.length} Google accounts`,
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
