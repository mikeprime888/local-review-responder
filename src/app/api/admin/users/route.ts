import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

async function isAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return false;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true },
  });

  return user?.isAdmin === true;
}

// GET /api/admin/users — List all users
export async function GET() {
  try {
    if (!(await isAdminUser())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        accounts: {
          select: {
            provider: true,
          },
        },
        _count: {
          select: {
            locations: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { email: 'asc' },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      providers: user.accounts.map((a) => a.provider),
      locationCount: user._count.locations,
      subscriptionCount: user._count.subscriptions,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Admin list users error:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// DELETE /api/admin/users — Delete a user by ID
export async function DELETE(request: Request) {
  try {
    if (!(await isAdminUser())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Prevent self-deletion
    const session = await getServerSession(authOptions);
    if (session?.user?.id === userId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Check user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Cancel all active Stripe subscriptions for this user
    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      select: { stripeSubscriptionId: true, status: true },
    });

    for (const sub of subscriptions) {
      if (['active', 'trialing', 'past_due'].includes(sub.status)) {
        try {
          await stripe.subscriptions.cancel(sub.stripeSubscriptionId);
          console.log(`Canceled Stripe subscription ${sub.stripeSubscriptionId}`);
        } catch (stripeError: any) {
          console.error(`Failed to cancel Stripe subscription ${sub.stripeSubscriptionId}:`, stripeError.message);
          // Continue with deletion even if Stripe cancel fails
        }
      }
    }

    // Delete user (cascades to accounts, sessions, locations, subscriptions, reviews)
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      success: true,
      message: `User ${user.email} deleted successfully (${subscriptions.length} subscription(s) canceled)`,
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
