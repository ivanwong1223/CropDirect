import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the payment intent to get its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Here you would typically:
      // 1. Update user's subscription in your database
      // 2. Send confirmation email
      // 3. Log the transaction
      
      const { planId, billingCycle } = paymentIntent.metadata;
      
      return NextResponse.json({
        success: true,
        paymentStatus: paymentIntent.status,
        planId,
        billingCycle,
        amount: paymentIntent.amount / 100, // Convert back from cents
        currency: paymentIntent.currency,
      });
    } else {
      return NextResponse.json({
        success: false,
        paymentStatus: paymentIntent.status,
        error: 'Payment not completed',
      });
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}
