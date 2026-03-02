import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/settings/notifications
 * Returns the current user's notification preferences
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notifyNewReviews: true,
        notifyLowRated: true,
        notifyWeeklyDigest: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      notifyNewReviews: user.notifyNewReviews,
      notifyLowRated: user.notifyLowRated,
      notifyWeeklyDigest: user.notifyWeeklyDigest,
      email: user.email,
    });
  } catch (error) {
    console.error('Failed to fetch notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/settings/notifications
 * Updates the current user's notification preferences
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();

    // Only allow updating known preference fields
    const allowedFields = ['notifyNewReviews', 'notifyLowRated', 'notifyWeeklyDigest'];
    const updateData: Record<string, boolean> = {};

    for (const field of allowedFields) {
      if (typeof body[field] === 'boolean') {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        notifyNewReviews: true,
        notifyLowRated: true,
        notifyWeeklyDigest: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
