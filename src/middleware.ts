import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if this is a widget API request
  const isWidgetApi = request.nextUrl.pathname.startsWith('/api/widget/');
  const isWidgetJs = request.nextUrl.pathname === '/widget.js';
  const isEmbed = request.nextUrl.pathname.startsWith('/embed/');

  if (isWidgetApi || isWidgetJs || isEmbed) {
    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Accept',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // For actual requests, clone the response and add CORS headers
    const response = NextResponse.next();
    
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');

    // Add cache headers for widget.js
    if (isWidgetJs) {
      response.headers.set('Cache-Control', 'public, max-age=3600'); // 1 hour
      response.headers.set('Content-Type', 'application/javascript');
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/widget/:path*',
    '/widget.js',
    '/embed/:path*',
  ],
};
