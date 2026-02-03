import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getValidAccessToken } from '@/lib/auth';
import { listAccounts } from '@/lib/google-business';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const accessToken = await getValidAccessToken(session.user.id);
    const accounts = await listAccounts(accessToken);

    return NextResponse.json({ accounts });
  } catch (error: any) {
    console.error('Error fetching GBP accounts:', error);

    if (error.message === 'GOOGLE_AUTH_EXPIRED') {
      return NextResponse.json(
        { error: 'Google authentication expired. Please sign out and sign in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}
