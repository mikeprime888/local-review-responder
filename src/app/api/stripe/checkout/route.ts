import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/stripe/checkout
 * 
 * Creates a Stripe Checkout session for subscribing to a location
 * 
 * Body: { locationId: string, priceType: 'monthly' | 'yearly' }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { locationId, priceType = 'monthly' } = body;

    if (!locationId) {
      return NextResponse.json(
        { error: 'Missing locationId' },
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(priceType)) {
      return NextResponse.json(
        { error: 'Invalid priceType. Must be "monthly" or "yearly"' },
        { status: 400 }
      );
    }

    // Verify the location exists and belongs to this user
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        userId: session.user.id,
      },
      include: {
        subscription: true,
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Check if location already has an active subscription
    if (location.subscription && 
        ['active', 'trialing'].includes(location.subscription.status)) {
      return NextResponse.json(
        { error: 'This location already has an active subscription' },
        { status: 400 }
      );
    }

    // Get base URL for success/cancel redirects
    const baseUrl = process.env.NEXTAUTH_URL || 'https://local-review-responder.vercel.app';

    // Create checkout session
    const checkoutSession = await createCheckoutSession({
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      locationId: location.id,
      locationName: location.title,
      priceType: priceType as 'monthly' | 'yearly',
      successUrl: `${baseUrl}/dashboard?subscription=success&location=${locationId}`,
      cancelUrl: `${baseUrl}/locations/add?canceled=true`,
    });

    return NextResponse.json({ 
      sessionId: checkoutSession.id,
      url: checkoutSession.url,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
