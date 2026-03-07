import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL('/dashboard?link_error=oauth_denied', process.env.NEXTAUTH_URL!));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?link_error=missing_params', process.env.NEXTAUTH_URL!));
  }

  // Verify signed state and extract userId
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);
  let userId: string;
  try {
    const { payload } = await jwtVerify(state, secret);
    userId = payload.userId as string;
  } catch (err) {
    console.error('Invalid state param:', err);
    return NextResponse.redirect(new URL('/dashboard?link_error=invalid_state', process.env.NEXTAUTH_URL!));
  }

  // Exchange auth code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/link-google/callback`,
      grant_type: 'authorization_code',
    }),
  });

  const tokens = await tokenRes.json();
  if (!tokenRes.ok) {
    console.error('Token exchange failed:', tokens);
    return NextResponse.redirect(new URL('/dashboard?link_error=token_failed', process.env.NEXTAUTH_URL!));
  }

  // Get the Google user's ID (providerAccountId)
  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const googleUser = await userInfoRes.json();

  if (!googleUser.id) {
    return NextResponse.redirect(new URL('/dashboard?link_error=no_google_id', process.env.NEXTAUTH_URL!));
  }

  // Upsert Account record — link this Google account to the current user
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'google',
        providerAccountId: googleUser.id,
      },
    },
    create: {
      userId,
      type: 'oauth',
      provider: 'google',
      providerAccountId: googleUser.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : null,
      token_type: tokens.token_type ?? 'Bearer',
      id_token: tokens.id_token ?? null,
      scope: tokens.scope ?? null,
    },
    update: {
      userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? undefined,
      expires_at: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : undefined,
      id_token: tokens.id_token ?? undefined,
    },
  });

  // Redirect to dashboard — ?linked=true triggers session.update() on client
  return NextResponse.redirect(new URL('/dashboard?linked=true', process.env.NEXTAUTH_URL!));
}
