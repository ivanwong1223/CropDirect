import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/payments/seller-history
 * Returns paginated payment (SalesTransaction) history for a seller (agribusiness).
 * Query params:
 * - sellerId: string (Agribusiness.id) [required]
 * - page: number (default 1)
 * - pageSize: number (default 10)
 *
 * Joins SalesTransaction -> Order to filter by the sellerId on the Order model.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sellerId = searchParams.get('sellerId')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.max(1, Math.min(100, parseInt(searchParams.get('pageSize') || '10', 10)))

  if (!sellerId) {
    return NextResponse.json({ success: false, error: 'Missing sellerId' }, { status: 400 })
  }

  try {
    const whereClause = { order: { sellerId } } as const

    const [totalCount, transactions] = await Promise.all([
      prisma.salesTransaction.count({ where: whereClause }),
      prisma.salesTransaction.findMany({
        where: whereClause,
        include: {
          order: {
            select: {
              id: true,
              quantity: true,
              currency: true,
              paymentStatus: true,
              product: { select: { productTitle: true } },
              buyer: { select: { companyName: true } },
              seller: { select: { businessName: true } },
            },
          },
        },
        orderBy: { paidAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    // Normalize Decimal values to number for safe JSON and flatten shape
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
    return NextResponse.json({ success: false, error: 'Failed to fetch seller payments history' }, { status: 500 })
  }
}