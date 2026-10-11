import { NextResponse } from 'next/server';

/**
 * Verifies `Authorization: Bearer <CRON_SECRET>`.
 * Fails closed: if CRON_SECRET is unset or empty, every request is rejected.
 * Returns an error response to send, or null when the request is authorized.
 */
export function checkCronSecret(request: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error('[cron-auth] CRON_SECRET is not set; rejecting request');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
