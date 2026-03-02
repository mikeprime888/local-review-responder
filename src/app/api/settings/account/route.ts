import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail, getAccountClosedEmailHtml } from '@/lib/email';

/**
 * GET /api/settings/account
 * Returns current user's account information
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
        id: true,
        name: true,
        email: true,
        image: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          },
        },
        _count: {
          select: {
            locations: true,
            subscriptions: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      providers: user.accounts.map((a) => a.provider),
      locationCount: user._count.locations,
      subscriptionCount: user._count.subscriptions,
    });
  } catch (error) {
    console.error('Failed to fetch account info:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/settings/account
 * Deletes the current user's account and all associated data.
 * Stripe subscriptions should be canceled via the portal first.
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        stripeCustomerId: true,
        subscriptions: {
          where: { status: { in: ['active', 'trialing'] } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Block deletion if active subscriptions exist
    if (user.subscriptions.length > 0) {
      return NextResponse.json(
        {
          error:
            'Please cancel all active subscriptions via "Manage Subscription" on the Billing page before closing your account.',
        },
        { status: 400 }
      );
    }

    // Cancel any Stripe subscriptions at Stripe level if customer exists
    if (user.stripeCustomerId) {
      try {
        const stripe = (await import('stripe')).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2024-12-18.acacia' as any,
        });

        // Cancel all subscriptions for this customer
        const subs = await stripeClient.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'all',
        });

        for (const sub of subs.data) {
          if (['active', 'trialing', 'past_due'].includes(sub.status)) {
            await stripeClient.subscriptions.cancel(sub.id);
          }
        }
      } catch (stripeError) {
        console.error('Stripe cleanup error (non-fatal):', stripeError);
        // Continue with account deletion even if Stripe cleanup fails
      }
    }

    // Send account closed email before deleting
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: 'Your Account Has Been Closed — Local Review Responder',
        html: getAccountClosedEmailHtml(user.name || undefined),
      });
    }

    // Delete user — cascade deletes locations, reviews, subscriptions, accounts, sessions
    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ success: true, message: 'Account deleted' });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
