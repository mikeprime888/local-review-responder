import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

async function isAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  return user?.isAdmin === true;
}

// POST /api/admin/comp — Grant comp access to a user
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdminUser())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, note } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        isComped: true,
        subscriptions: {
          where: { status: { in: ['active', 'trialing', 'past_due'] } },
          select: { stripeSubscriptionId: true, status: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.isComped) {
      return NextResponse.json({ error: 'User is already comped' }, { status: 400 });
    }

    // Cancel active Stripe subscriptions at period end (no immediate charge disruption)
    for (const sub of user.subscriptions) {
      try {
        await stripe.subscriptions.update(sub.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
        console.log(`Comp: Set cancel_at_period_end for subscription ${sub.stripeSubscriptionId}`);
      } catch (stripeError: any) {
        console.error(`Comp: Failed to update subscription ${sub.stripeSubscriptionId}:`, stripeError.message);
      }
    }

    // Grant comp access
    await prisma.user.update({
      where: { email },
      data: {
        isComped: true,
        compedAt: new Date(),
        compedNote: note || null,
      },
    });

    // Ensure all user locations are active
    await prisma.location.updateMany({
      where: { userId: user.id },
      data: { isActive: true },
    });

    return NextResponse.json({
      success: true,
      message: `Comp access granted to ${email}. ${user.subscriptions.length} subscription(s) set to cancel at period end.`,
    });
  } catch (error: any) {
    console.error('Admin comp grant error:', error);
    return NextResponse.json({ error: 'Failed to grant comp access' }, { status: 500 });
  }
}

// DELETE /api/admin/comp — Revoke comp access
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdminUser())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isComped: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.isComped) {
      return NextResponse.json({ error: 'User is not comped' }, { status: 400 });
    }

    // Revoke comp access
    await prisma.user.update({
      where: { email },
      data: { isComped: false },
    });

    // Deactivate locations that don't have an active subscription
    const locationsToDeactivate = await prisma.location.findMany({
      where: {
        userId: user.id,
        OR: [
          { subscription: null },
          { subscription: { status: { notIn: ['active', 'trialing'] } } },
        ],
      },
      select: { id: true },
    });

    if (locationsToDeactivate.length > 0) {
      await prisma.location.updateMany({
        where: { id: { in: locationsToDeactivate.map((l) => l.id) } },
        data: { isActive: false },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Comp access revoked for ${email}. ${locationsToDeactivate.length} location(s) deactivated (no active subscription).`,
    });
  } catch (error: any) {
    console.error('Admin comp revoke error:', error);
    return NextResponse.json({ error: 'Failed to revoke comp access' }, { status: 500 });
  }
}
