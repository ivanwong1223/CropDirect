// import { NextRequest, NextResponse } from 'next/server';
// import Stripe from 'stripe';
// import { headers } from 'next/headers';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2025-07-30.basil',
// });

// const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// export async function POST(request: NextRequest) {
//   try {
//     const body = await request.text();
//     const headersList = await headers();
//     const signature = headersList.get('stripe-signature');

//     if (!signature) {
//       return NextResponse.json(
//         { error: 'Missing stripe-signature header' },
//         { status: 400 }
//       );
//     }

//     let event: Stripe.Event;

//     try {
//       event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
//     } catch (err) {
//       console.error('Webhook signature verification failed:', err);
//       return NextResponse.json(
//         { error: 'Invalid signature' },
//         { status: 400 }
//       );
//     }

//     // Handle the event
//     switch (event.type) {
//       case 'payment_intent.succeeded':
//         const paymentIntent = event.data.object as Stripe.PaymentIntent;
//         console.log('Payment succeeded:', paymentIntent.id);
        
//         // Here you would typically:
//         // 1. Update user's subscription status in your database
//         // 2. Send confirmation email
//         // 3. Log the transaction
//         // 4. Activate the subscription features
        
//         const { planId, billingCycle } = paymentIntent.metadata;
//         console.log(`Activating ${planId} plan with ${billingCycle} billing`);
        
//         break;

//       case 'payment_intent.payment_failed':
//         const failedPayment = event.data.object as Stripe.PaymentIntent;
//         console.log('Payment failed:', failedPayment.id);
        
//         // Handle failed payment
//         // 1. Log the failure
//         // 2. Send notification to user
//         // 3. Update payment status
        
//         break;

//       case 'invoice.payment_succeeded':
//         const invoice = event.data.object as Stripe.Invoice;
//         console.log('Invoice payment succeeded:', invoice.id);
        
//         // Handle recurring payment success
//         break;

//       case 'invoice.payment_failed':
//         const failedInvoice = event.data.object as Stripe.Invoice;
//         console.log('Invoice payment failed:', failedInvoice.id);
        
//         // Handle recurring payment failure
//         break;

//       default:
//         console.log(`Unhandled event type: ${event.type}`);
//     }

//     return NextResponse.json({ received: true });
//   } catch (error) {
//     console.error('Webhook error:', error);
//     return NextResponse.json(
//       { error: 'Webhook handler failed' },
//       { status: 500 }
//     );
//   }
// }