import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/locations/activate
 *
 * Activates a location directly for comped users, bypassing Stripe.
 *
 * Body: { locationId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!(session.user as any).isComped) {
      return NextResponse.json({ error: 'This endpoint is only available for comped accounts.' }, { status: 403 });
    }

    const body = await request.json();
    const { locationId } = body;

    if (!locationId) {
      return NextResponse.json({ error: 'Missing locationId' }, { status: 400 });
    }

    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId: session.user.id,
      },
    });

    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 403 });
    }

    await prisma.location.update({
      where: { id: locationId },
      data: { isActive: true },
    });

    return NextResponse.json({ activated: true }, { status: 200 });
  } catch (error: any) {
    console.error('Activate location error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to activate location' },
      { status: 500 }
    );
  }
}
