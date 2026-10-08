import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all location IDs for this user (needed to delete reviews and widget settings)
    const locationIds = await prisma.location.findMany({
      where: { userId },
      select: { id: true },
    });
    const ids = locationIds.map((l) => l.id);

    // Delete in FK-safe order
    if (ids.length > 0) {
      await prisma.review.deleteMany({ where: { locationId: { in: ids } } });
      await prisma.widgetSettings.deleteMany({ where: { locationId: { in: ids } } });
    }
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.location.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account deletion failed:', error);
    return NextResponse.json(
      { error: 'Failed to delete account. Please try again or contact support.' },
      { status: 500 }
    );
  }
}
