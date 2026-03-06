import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Places API not configured' }, { status: 500 });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('type', 'establishment');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message);
      return NextResponse.json({ error: 'Places search failed', status: data.status }, { status: 500 });
    }

    const results = (data.results || []).slice(0, 6).map((place: {
      place_id: string;
      name: string;
      formatted_address: string;
      rating?: number;
      user_ratings_total?: number;
      types?: string[];
    }) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      totalRatings: place.user_ratings_total,
      types: place.types,
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error('Places search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
