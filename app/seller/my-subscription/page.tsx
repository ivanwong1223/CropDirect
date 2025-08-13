"use client";

import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, ShieldPlus, ArrowLeft } from "lucide-react";
import { mockSubscriptionPlans, type SubscriptionPlan, PaymentResult } from "@/lib/mockData";
import StripePaymentForm from "@/components/custom/StripePaymentForm";

export default function Subscription() {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly;
  };

  const getPlanIcon = (planId: string) => {
    if (planId === 'enterprise') {
      return <Crown className="w-8 h-8 text-orange-500" />;
    }
    if (planId === 'standard') {
      return <ShieldPlus className="w-8 h-8 text-blue-500" />;
    }
    return <Zap className="w-8 h-8 text-blue-500" />;
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (paymentResult: PaymentResult) => {
    console.log('Payment successful:', paymentResult);
    setPaymentSuccess(true);
    setShowPaymentForm(false);
    // Here you would typically update the user's subscription status
    // Example: updateUserSubscription(paymentResult.planId, paymentResult.billingCycle);
  };

  const handlePaymentCancel = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
  };

  const handleBackToPlans = () => {
    setShowPaymentForm(false);
    setSelectedPlan(null);
    setPaymentSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header Section */}
      <div className="relative">
        <div className="container mx-auto px-4 py-25">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Pricing Table
            </h1>
          </div>
        </div>
        
        {/* Curved Bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto">
            <path
              d="M0,0 C480,120 960,120 1440,0 L1440,120 L0,120 Z"
              fill="#f8fafc"
            />
          </svg>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Toggle Button */}
            <div className="flex justify-center mb-12">
              <div className="bg-slate-200 p-1 rounded-full flex items-center">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 cursor-pointer rounded-full text-sm font-medium transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 cursor-pointer rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Yearly
                  <span className="text-xs text-green-600 font-semibold">
                    (save 15%)
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {mockSubscriptionPlans.map((plan, index) => (
                <div key={plan.id} className="relative">
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-[#B1D7B6] text-black px-10 py-1 text-sm tracking-wide">
                        Most popular
                      </Badge>
                    </div>
                  )}
                  
                  <Card className={`h-full transition-all duration-300 hover:shadow-xl ${
                    plan.isPopular 
                      ? 'shadow-lg scale-105' 
                      : 'hover:scale-105'
                  }`}>
                    <CardContent className="p-8">
                      {/* Plan Icon */}
                      <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                          {getPlanIcon(plan.id)}
                        </div>
                      </div>

                      {/* Plan Name & Description */}
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          {plan.name}
                        </h3>
                        <p className="text-slate-600 text-sm">
                          {plan.description}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-center mb-8">
                        <div className="flex items-baseline justify-center">
                          <span className="text-3xl font-bold text-slate-900">$</span>
                          <span className="text-5xl font-bold text-slate-900">
                            {getPrice(plan)}
                          </span>
                          <span className="text-slate-600 ml-1">
                            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="mb-8">
                        <Button 
                          onClick={() => {
                            if (plan.id === 'free') {
                              router.push(`/seller/product-list`);
                            } else {
                              handlePlanSelect(plan);
                            }
                          }}
                          className={`w-full py-6 cursor-pointer text-sm font-medium ${
                            plan.isPopular
                              ? 'bg-green-800 hover:bg-green-900 text-white'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                          }`}
                        >
                          {plan.id === 'free' ? 'Get Started' : `${plan.trialDays}-Day Free Trial`}
                        </Button>
                      </div>

                      {/* Features List */}
                      <div className="space-y-4">
                        {plan.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                              <Check className="w-3 h-3 text-green-600" />
                            </div>
                            <span className="text-slate-700 text-sm leading-relaxed">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Form Modal/Overlay */}
      {showPaymentForm && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePaymentCancel}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="text-xl font-semibold">Complete Your Subscription</h2>
            </div>
            
            <StripePaymentForm
              selectedPlan={selectedPlan}
              billingCycle={billingCycle}
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      )}

      {/* Success State */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Subscription Activated!
            </h3>
            <p className="text-gray-600 mb-6">
              Welcome to {selectedPlan?.name} plan. Your {selectedPlan?.trialDays}-day free trial has started.
            </p>
            <Button onClick={handleBackToPlans} className="w-full bg-green-600 hover:bg-green-700">
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
