import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/widget/summary?locations=id1,id2,... - Public aggregate rating strip.
// Blends an EXPLICIT subset of locations (internal Location.id cuids, same id the
// per-location embed uses via data-location-id) into one count-weighted rating.
// Only active locations with real Google aggregates are included.
export async function GET(request: NextRequest) {
  // CORS + cache mirror the single-location widget endpoint (embedded, public).
  const withHeaders = (res: NextResponse) => {
    res.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    res.headers.set('Access-Control-Allow-Origin', '*');
    return res;
  };
  // Explicit empty signal — never 0.0 ★ / 0 reviews.
  const empty = () => withHeaders(NextResponse.json({ empty: true }));

  try {
    const { searchParams } = new URL(request.url);
    const ids = Array.from(
      new Set(
        (searchParams.get('locations') || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );

    if (ids.length === 0) return empty();

    // Load only active locations that have a real Google aggregate.
    const locations = await prisma.location.findMany({
      where: {
        id: { in: ids },
        isActive: true,
        averageRating: { not: null },
        totalReviews: { gt: 0 },
      },
      select: { averageRating: true, totalReviews: true, userId: true },
    });

    if (locations.length === 0) return empty();

    // All listed locations must belong to one account; otherwise treat as empty
    // (guards against a mistyped cuid resolving to another customer's location).
    const userIds = new Set(locations.map((l) => l.userId));
    if (userIds.size > 1) return empty();

    // Count-weighted blend: Σ(avg_i × n_i) / Σ(n_i), summed review count.
    let weightedSum = 0;
    let totalReviews = 0;
    for (const loc of locations) {
      // averageRating non-null and totalReviews > 0 are guaranteed by the query.
      weightedSum += (loc.averageRating as number) * loc.totalReviews;
      totalReviews += loc.totalReviews;
    }
    const averageRating = weightedSum / totalReviews; // totalReviews > 0 guaranteed

    return withHeaders(
      NextResponse.json({
        empty: false,
        averageRating, // raw float; the widget formats with toFixed(1)
        totalReviews,
        locationCount: locations.length,
      })
    );
  } catch (error: any) {
    console.error('Widget summary error:', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
