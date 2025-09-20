import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Map planId from UI to SubscriptionTier enum value used by Prisma
function mapPlanIdToTier(planId: string): 'FREE' | 'STANDARD' | 'ELITE' {
  switch (planId) {
    case 'standard':
      return 'STANDARD';
    case 'enterprise':
      return 'ELITE';
    case 'free':
    default:
      return 'FREE';
  }
}

// Map billing cycle from UI to Prisma enum values
function mapBillingCycle(cycle: 'monthly' | 'yearly'): 'MONTHLY' | 'YEARLY' {
  return cycle === 'yearly' ? 'YEARLY' : 'MONTHLY';
}

// Compute next billing date based on billing cycle
function computeNextBillingDate(cycle: 'MONTHLY' | 'YEARLY'): { start: Date; end: Date } {
  const start = new Date();
  const end = new Date(start);
  if (cycle === 'YEARLY') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return { start, end };
}

/**
 * POST /api/subscription/activate
 * Finalizes a paid subscription for an Agribusiness user.
 * - Upserts the Subscription row with the selected tier and billing cycle
 * - Updates Agribusiness.subscriptionTier (string) to keep legacy checks working
 * - Inserts a BillingHistory entry marked as PAID
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId, billingCycle, amount, currency = 'USD', paymentIntentId } = body as {
      userId?: string;
      planId?: string;
      billingCycle?: 'monthly' | 'yearly';
      amount?: number;
      currency?: string;
      paymentIntentId?: string;
    };

    if (!userId || !planId || !billingCycle || typeof amount !== 'number') {
      return NextResponse.json(
        { success: false, error: 'Missing required fields (userId, planId, billingCycle, amount)' },
        { status: 400 }
      );
    }

    // Find agribusiness by user
    const agribusiness = await prisma.agribusiness.findUnique({ where: { userId } });
    if (!agribusiness) {
      return NextResponse.json(
        { success: false, error: 'Agribusiness profile not found for user' },
        { status: 404 }
      );
    }

    const tier = mapPlanIdToTier(planId);
    const cycle = mapBillingCycle(billingCycle);
    const { start, end } = computeNextBillingDate(cycle);

    // Persist all changes atomically
    const result = await prisma.$transaction(async (tx) => {
      // Upsert subscription for this agribusiness
      const subscription = await tx.subscription.upsert({
        where: { agribusinessId: agribusiness.id },
        update: {
          tier, // enum SubscriptionTier
          billingCycle: cycle, // enum BillingCycle
          status: 'ACTIVE',
          currentPeriodStart: start,
          currentPeriodEnd: end,
          nextBillingDate: end,
        },
        create: {
          agribusinessId: agribusiness.id,
          tier,
          billingCycle: cycle,
          status: 'ACTIVE',
          currentPeriodStart: start,
          currentPeriodEnd: end,
          nextBillingDate: end,
        },
      });

      // Update legacy string field for compatibility in the app
      const updatedAgribusiness = await tx.agribusiness.update({
        where: { id: agribusiness.id },
        data: { subscriptionTier: tier },
      });

      // Record billing history entry as paid
      await tx.billingHistory.create({
        data: {
          subscriptionId: subscription.id,
          tier,
          amount,
          currency,
          billingCycle: cycle,
          paymentStatus: 'PAID',
          paidAt: new Date(),
        },
      });

      return { subscription, agribusiness: updatedAgribusiness };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Subscription activation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to activate subscription' },
      { status: 500 }
    );
  }
}