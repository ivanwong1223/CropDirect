import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/loyalty/claim
 * Body: { buyerId: string }
 * Business rule: When buyer reaches 2 completed (delivered) purchases that haven't yet granted the bonus,
 * award 20 bonus points and create a LoyaltyPointHistory entry with type 'EARN' and description.
 * This endpoint is idempotent: it won't double-award if already claimed for current milestone.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { buyerId } = body as { buyerId?: string };

    if (!buyerId) {
      return NextResponse.json(
        { success: false, error: 'buyerId is required' },
        { status: 400 }
      );
    }

    // Define constants for the milestone
    const REQUIRED_COMPLETED_PURCHASES = 2;
    const BONUS_POINTS = 20;

    // Compute delivered orders count for buyer
    const completedCount = await prisma.order.count({
      where: { buyerId, status: 'delivered' }
    });

    if (completedCount < REQUIRED_COMPLETED_PURCHASES) {
      return NextResponse.json({
        success: false,
        error: `Milestone not reached: ${completedCount}/${REQUIRED_COMPLETED_PURCHASES} completed purchases`,
        code: 'NOT_REACHED'
      }, { status: 400 });
    }

    // Idempotency: check if a bonus record already exists for this milestone window.
    // We'll mark bonus using description tag 'BONUS_2_PURCHASES'.
    const existingBonus = await prisma.loyaltyPointHistory.findFirst({
      where: {
        buyerId,
        description: 'BONUS_2_PURCHASES',
      }
    });

    if (existingBonus) {
      return NextResponse.json({ success: true, data: { alreadyClaimed: true, awarded: 0 } });
    }

    // Transaction: add points and create history entry
    const result = await prisma.$transaction(async (tx) => {
      const buyer = await tx.businessBuyer.update({
        where: { id: buyerId },
        data: { loyaltyPoints: { increment: BONUS_POINTS } },
        select: { id: true, loyaltyPoints: true }
      });

      const history = await tx.loyaltyPointHistory.create({
        data: {
          buyerId,
          type: 'EARN',
          points: BONUS_POINTS,
          description: 'BONUS_2_PURCHASES',
        },
        select: { id: true, createdAt: true }
      });

      return { buyer, history };
    });

    return NextResponse.json({
      success: true,
      data: { awarded: BONUS_POINTS, buyer: result.buyer, historyId: result.history.id }
    });
  } catch (error) {
    console.error('Error claiming loyalty bonus:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim loyalty bonus' },
      { status: 500 }
    );
  }
}