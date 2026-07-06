import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public, unauthenticated pre-login check used by the credentials login form to
// steer OAuth-only users to the Google button. Deliberately narrow: the ONLY
// state it ever reveals is "this email is a Google-only account" (user exists,
// no password hash, and has a linked Google account). The no-user case and the
// has-password case both return { isOAuthOnly: false } — so this endpoint never
// discloses whether an arbitrary email has an account, only whether a login
// failure was because the account is OAuth-only.
//
// Email is read from the POST body, never a query string (no PII in URLs).
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ isOAuthOnly: false });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    // Only continue for an existing account with no password hash.
    if (!user || user.password) {
      return NextResponse.json({ isOAuthOnly: false });
    }

    // Confirm the passwordless account is specifically a Google OAuth account
    // (same Account/provider lookup used in auth.ts and check-google).
    const googleAccount = await prisma.account.findFirst({
      where: { userId: user.id, provider: 'google' },
      select: { id: true },
    });

    return NextResponse.json({ isOAuthOnly: !!googleAccount });
  } catch {
    // Fail closed to the generic message — never leak account state on error.
    return NextResponse.json({ isOAuthOnly: false });
  }
}
