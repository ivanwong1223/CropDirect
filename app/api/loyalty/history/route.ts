import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/loyalty/history
 * Returns loyalty point history for a buyer with pagination.
 * Query params:
 * - buyerId: string (BusinessBuyer.id) [required]
 * - page: number (default: 1)
 * - pageSize: number (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const buyerId = searchParams.get('buyerId');
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');

    if (!buyerId) {
      return NextResponse.json(
        { success: false, error: 'buyerId is required' },
        { status: 400 }
      );
    }

    const page = Math.max(parseInt(pageParam || '1', 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(pageSizeParam || '10', 10) || 10, 1), 100);
    const skip = (page - 1) * pageSize;

    const [items, totalCount] = await Promise.all([
      prisma.loyaltyPointHistory.findMany({
        where: { buyerId },
        include: {
          order: {
            select: {
              id: true,
              product: { select: { productTitle: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.loyaltyPointHistory.count({ where: { buyerId } })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: items.map((i) => ({
          id: i.id,
          type: i.type,
          points: i.points,
          amount: i.amount,
          description: i.description,
          createdAt: i.createdAt,
          order: i.order ? { id: i.order.id, productTitle: i.order.product?.productTitle } : null,
        })),
        totalCount,
        page,
        pageSize,
      }
    });
  } catch (error) {
    console.error('Error fetching loyalty history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch loyalty history' },
      { status: 500 }
    );
  }
}