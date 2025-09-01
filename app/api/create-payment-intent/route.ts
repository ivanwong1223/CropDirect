import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe client using account's default API version for compatibility.
// Avoid hardcoding a future or unsupported apiVersion string to prevent SDK/type mismatches.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * POST /api/create-payment-intent
 * Create a Payment Intent for card payments.
 * - Accepts amount and currency (default 'usd'); converts amount into minor units (cents).
 * - Supports optional planId/billingCycle and arbitrary metadata keys for flexible flows.
 */
export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'usd', planId, billingCycle, metadata } = await request.json();

    // Validate required fields
    if (!amount) {
      return NextResponse.json(
        { error: 'Missing required field: amount' },
        { status: 400 }
      );
    }

    // Build metadata flexibly to support both subscription and purchase flows
    const intentMetadata: Record<string, string> = {};
    if (planId) intentMetadata.planId = String(planId);
    if (billingCycle) intentMetadata.billingCycle = String(billingCycle);
    if (metadata && typeof metadata === 'object') {
      for (const [key, value] of Object.entries(metadata)) {
        if (value !== undefined && value !== null) {
          intentMetadata[key] = String(value);
        }
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100), // Convert to smallest currency unit
      currency: String(currency).toLowerCase(),
      metadata: intentMetadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}