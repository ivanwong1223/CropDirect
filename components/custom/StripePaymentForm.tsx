"use client";

import React, { useState, useEffect } from 'react';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Lock, CheckCircle, XCircle } from 'lucide-react';
import { SubscriptionPlan, PaymentResult } from '@/lib/mockData';
import { 
  stripePromise, 
  createPaymentIntent, 
  formatStripeError,
  formatCurrency 
} from '@/lib/stripe-utils';

interface StripePaymentFormProps {
  selectedPlan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: (paymentResult: PaymentResult) => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<StripePaymentFormProps> = ({
  selectedPlan,
  billingCycle,
  onSuccess,
  onCancel,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');

  const amount = billingCycle === 'monthly' ? selectedPlan.price.monthly : selectedPlan.price.yearly;

  // Create payment intent when component mounts
  useEffect(() => {
    const initializePayment = async () => {
      try {
        const data = await createPaymentIntent({
          amount,
          currency: 'usd',
          planId: selectedPlan.id,
          billingCycle,
        });

        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setErrorMessage('Failed to initialize payment');
        }
      } catch (error) {
        setErrorMessage(formatStripeError(error as { type?: string; code?: string; message?: string }));
      }
    };

    initializePayment();
  }, [amount, selectedPlan.id, billingCycle]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage('');

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setErrorMessage('Card element not found');
      setIsProcessing(false);
      setPaymentStatus('error');
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        setErrorMessage(formatStripeError(error));
        setPaymentStatus('error');
      } else if (paymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        onSuccess({
          paymentIntentId: paymentIntent.id,
          planId: selectedPlan.id,
          billingCycle,
          amount,
          currency: 'usd',
          success: true
        });
      }
    } catch (error) {
      setErrorMessage('An unexpected error occurred');
      setPaymentStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
        fontFamily: 'system-ui, -apple-system, sans-serif',
      },
      invalid: {
        color: '#9e2146',
      },
    },
    hidePostalCode: false,
  };

  if (paymentStatus === 'success') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Payment Successful!
          </h3>
          <p className="text-gray-600 mb-6">
            Your subscription to {selectedPlan.name} plan has been activated.
          </p>
          <Button onClick={() => onSuccess({ 
              paymentIntentId: '', 
              planId: selectedPlan.id, 
              billingCycle, 
              amount: selectedPlan.price[billingCycle],
              currency: 'usd',
              success: true 
            })} className="w-full">
            Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Plan Summary */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Order Summary</span>
            <Badge variant="outline">{selectedPlan.name}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Billing:</span>
              <span className="font-medium capitalize">{billingCycle}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Trial Period:</span>
              <span className="font-medium">{selectedPlan.trialDays} days</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>{formatCurrency(amount)}/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card Element */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Card Information
              </label>
              <div className="p-3 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <CardElement options={cardElementOptions} />
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">{errorMessage}</span>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Lock className="w-3 h-3" />
              <span>Your payment information is secure and encrypted</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!stripe || isProcessing || !clientSecret}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${formatCurrency(amount)}`
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const StripePaymentForm: React.FC<StripePaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
};

export default StripePaymentForm;