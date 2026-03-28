import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not authenticated', session });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isAdmin: true, isComped: true },
  });

  const subscriptionsRes = await fetch(
    `${process.env.NEXTAUTH_URL}/api/subscriptions?active=true`,
    { headers: { cookie: '' } }
  ).catch(() => null);

  return NextResponse.json({
    sessionUserId: session.user.id,
    sessionUserEmail: session.user.email,
    sessionIsAdmin: (session.user as any).isAdmin,
    sessionIsComped: (session.user as any).isComped,
    dbUser,
    dbUserFound: !!dbUser,
  });
}
