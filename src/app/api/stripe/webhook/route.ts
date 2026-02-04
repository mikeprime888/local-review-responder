import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
    }
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { userId, locationId } = session.metadata || {};
  if (!userId || !locationId) return;

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) return;

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Debug logging
  console.log('Subscription retrieved:', JSON.stringify(sub, null, 2));
  
  // Get timestamps with fallbacks
  const currentPeriodStart = sub.current_period_start 
    ? new Date(sub.current_period_start * 1000) 
    : new Date();
  const currentPeriodEnd = sub.current_period_end 
    ? new Date(sub.current_period_end * 1000) 
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const trialEnd = sub.trial_end 
    ? new Date(sub.trial_end * 1000) 
    : null;

  await prisma.subscription.upsert({
    where: { locationId },
    create: {
      userId,
      locationId,
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0].price.id,
      status: sub.status,
      currentPeriodStart,
      currentPeriodEnd,
      trialEnd,
    },
    update: {
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0].price.id,
      status: sub.status,
      currentPeriodStart,
      currentPeriodEnd,
      trialEnd,
    },
  });

  await prisma.location.update({
    where: { id: locationId },
    data: { isActive: true },
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const existingSub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSub) return;

  const currentPeriodStart = subscription.current_period_start 
    ? new Date(subscription.current_period_start * 1000) 
    : new Date();
  const currentPeriodEnd = subscription.current_period_end 
    ? new Date(subscription.current_period_end * 1000) 
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const trialEnd = subscription.trial_end 
    ? new Date(subscription.trial_end * 1000) 
    : null;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: subscription.status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd,
    },
  });

  const isActive = ['active', 'trialing'].includes(subscription.status);
  await prisma.location.update({
    where: { id: existingSub.locationId },
    data: { isActive },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existingSub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!existingSub) return;

  await prisma.subscription.update({
    where: { stripeSubscriptionId: subscription.id },
    data: { status: 'canceled' },
  });

  await prisma.location.update({
    where: { id: existingSub.locationId },
    data: { isActive: false },
  });
}
