import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const googleAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google',
      },
      select: {
        id: true,
        access_token: true,
      },
    });

    return NextResponse.json({
      hasGoogleAccount: !!googleAccount,
      hasValidToken: !!googleAccount?.access_token,
    });
  } catch (error) {
    console.error('Check Google account error:', error);
    return NextResponse.json(
      { error: 'Failed to check Google account status' },
      { status: 500 }
    );
  }
}
