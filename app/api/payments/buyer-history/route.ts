import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/payments/buyer-history
 * Returns paginated payment (SalesTransaction) history for a buyer.
 * Query params:
 * - buyerId: string (BusinessBuyer.id) [required]
 * - page: number (default 1)
 * - pageSize: number (default 10)
 *
 * Joins SalesTransaction -> Order to filter by the buyerId on the Order model.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const buyerId = searchParams.get('buyerId')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '10', 10)))

  if (!buyerId) {
    return NextResponse.json({ success: false, error: 'Missing buyerId' }, { status: 400 })
  }

  try {
    const whereClause = { order: { buyerId } } as const

    const [totalCount, transactions] = await Promise.all([
      prisma.salesTransaction.count({ where: whereClause }),
      prisma.salesTransaction.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              currency: true,
              paymentStatus: true,
              product: { select: { productTitle: true } },
              seller: { select: { businessName: true } },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    // Normalize Decimal values to number for safe JSON
    const items = transactions.map((t) => ({
      id: t.id,
      orderId: t.orderId,
      amountPaid: Number(t.amountPaid),
      currency: t.currency,
      paymentMethod: t.paymentMethod,
      stripePaymentIntentId: t.stripePaymentIntentId,
      paidAt: t.paidAt,
      isRefunded: t.isRefunded,
      refundAmount: t.refundAmount != null ? Number(t.refundAmount) : null,
      refundReason: t.refundReason,
      refundedAt: t.refundedAt,
      stripeRefundId: t.stripeRefundId,
      order: t.order,
    }))

    return NextResponse.json({
      success: true,
      data: {
        items,
        totalCount,
        page,
        pageSize,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Failed to fetch payments history' }, { status: 500 })
  }
}