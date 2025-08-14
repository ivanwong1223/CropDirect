import { loadStripe } from '@stripe/stripe-js';
import { PaymentConfirmationResponse } from './mockData';
import { StripeCardElement } from '@stripe/stripe-js';

// Initialize Stripe
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

// Utility function to format currency
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
};

// Utility function to convert dollars to cents for Stripe
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

// Utility function to convert cents to dollars
export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

// Validate card element
export const validateCardElement = (cardElement: StripeCardElement | null): boolean => {
  return cardElement !== null && typeof cardElement.focus === 'function';
};

// Payment intent creation helper
export const createPaymentIntent = async ({
  amount,
  currency = 'usd',
  planId,
  billingCycle,
}: {
  amount: number;
  currency?: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
}) => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        planId,
        billingCycle,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Payment confirmation helper
export const confirmPayment = async (paymentIntentId: string) => {
  try {
    const response = await fetch('/api/confirm-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentIntentId }),
    });

    if (!response.ok) {
      throw new Error('Failed to confirm payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

// Error message formatter for Stripe errors
export const formatStripeError = (error: { type?: string; code?: string; message?: string }): string => {
  if (error?.type === 'card_error') {
    switch (error.code) {
      case 'card_declined':
        return 'Your card was declined. Please try a different payment method.';
      case 'expired_card':
        return 'Your card has expired. Please use a different card.';
      case 'incorrect_cvc':
        return 'Your card\'s security code is incorrect.';
      case 'processing_error':
        return 'An error occurred while processing your card. Please try again.';
      case 'incorrect_number':
        return 'Your card number is incorrect.';
      default:
        return error.message || 'Your card could not be processed. Please try again.';
    }
  }
  
  return error?.message || 'An unexpected error occurred. Please try again.';
};
