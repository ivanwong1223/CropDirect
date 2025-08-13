# Stripe Payment Integration Setup

This document outlines the Stripe payment integration implemented for the CropDirect subscription system.

## Overview

The Stripe integration allows users to purchase subscription plans with secure credit/debit card payments. The implementation includes:

- Payment intent creation and confirmation
- Secure card element for payment details
- Webhook handling for payment events
- Error handling and user feedback
- Modal-based payment flow

## Files Created/Modified

### API Routes
- `app/api/create-payment-intent/route.ts` - Creates Stripe payment intents
- `app/api/confirm-payment/route.ts` - Confirms payment status
- `app/api/webhooks/stripe/route.ts` - Handles Stripe webhooks

### Components
- `components/custom/StripePaymentForm.tsx` - Main payment form component
- `app/seller/my-subscription/page.tsx` - Updated subscription page with payment integration

### Utilities
- `lib/stripe-utils.ts` - Stripe utility functions and helpers

## Environment Variables

Add these to your `.env` file:

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... # Optional, for webhook verification
```

## Dependencies

The following packages are required (already installed):

```json
{
  "@stripe/stripe-js": "^7.4.0",
  "@stripe/react-stripe-js": "^2.x.x",
  "stripe": "^18.4.0"
}
```

## Usage

### 1. Plan Selection
Users can select from three subscription plans:
- Free Plan: $20/month or $16/year
- Standard Plan: $30/month or $27/year (Most Popular)
- Enterprise Plan: $50/month or $40/year

### 2. Payment Flow
1. User clicks "X-Day Free Trial" button on a plan
2. Payment modal opens with plan summary and card form
3. User enters payment details using Stripe Elements
4. Payment is processed securely through Stripe
5. Success/error feedback is displayed
6. On success, subscription is activated

### 3. Security Features
- PCI-compliant card handling via Stripe Elements
- Secure payment intent creation
- Webhook verification for payment events
- Error handling with user-friendly messages

## Stripe Dashboard Configuration

### 1. Webhook Setup
In your Stripe Dashboard:
1. Go to Developers > Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 2. Test Cards
For testing, use these Stripe test cards:
- Success: `4242424242424242`
- Decline: `4000000000000002`
- Insufficient funds: `4000000000009995`

## Customization

### Styling
The payment form uses Tailwind CSS and shadcn/ui components. Customize the appearance by modifying:
- Card element styles in `cardElementOptions`
- Modal styling in the subscription page
- Button and form styling

### Currency
Currently set to USD. To change:
1. Update the `currency` parameter in payment intent creation
2. Modify the `formatCurrency` function in `stripe-utils.ts`
3. Update plan prices in `mockData.ts`

### Plans
Modify subscription plans in `lib/mockData.ts`:
```typescript
export const mockSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: "plan-id",
    name: "Plan Name",
    price: { monthly: 29, yearly: 25 },
    // ... other properties
  }
];
```

## Error Handling

The integration includes comprehensive error handling:
- Network errors
- Stripe API errors
- Card validation errors
- Payment failures

Errors are displayed to users with helpful messages and suggested actions.

## Security Considerations

1. **Never expose secret keys** - Only use publishable keys in frontend code
2. **Validate webhooks** - Always verify webhook signatures
3. **Server-side validation** - Confirm payments on the server
4. **HTTPS required** - Stripe requires HTTPS in production

## Testing

1. Use Stripe test mode keys
2. Test with various card scenarios
3. Verify webhook delivery
4. Test error conditions
5. Confirm payment flow end-to-end

## Production Deployment

1. Replace test keys with live keys
2. Update webhook endpoints
3. Configure proper error logging
4. Set up monitoring for payment failures
5. Implement proper subscription management

## Support

For issues with the Stripe integration:
1. Check Stripe Dashboard logs
2. Review webhook delivery status
3. Verify API key configuration
4. Test with Stripe CLI for local development