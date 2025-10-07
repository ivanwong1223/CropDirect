import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET /api/chat/unread-count
 * Returns count of UNREAD messages for a seller across all chat rooms.
 * Query params:
 * - sellerId: string (Agribusiness.id) [required]
 * - since: ISO timestamp [optional] — additionally filter messages created after this time
 *
 * Logic:
 * - Resolve seller's userId from Agribusiness
 * - Count messages in rooms where chatRoom.sellerId = sellerId
 * - Exclude messages sent by the seller (senderId != seller.userId)
 * - Only include messages with isRead = false
 * - If `since` provided, additionally include messages with createdAt > since
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sellerId = searchParams.get('sellerId')
  const since = searchParams.get('since')

  if (!sellerId) {
    return NextResponse.json({ success: false, error: 'Missing sellerId' }, { status: 400 })
  }

  try {
    const seller = await prisma.agribusiness.findUnique({ where: { id: sellerId }, select: { userId: true } })
    if (!seller) {
      return NextResponse.json({ success: false, error: 'Seller not found' }, { status: 404 })
    }

    const where: any = {
      chatRoom: { sellerId },
      senderId: { not: seller.userId },
      isRead: false,
    }
    if (since) {
      const sinceDate = new Date(since)
      if (!isNaN(sinceDate.getTime())) {
        where.createdAt = { gt: sinceDate }
      }
    }

    const count = await prisma.message.count({ where })
    return NextResponse.json({ success: true, data: { count } })
  } catch (e) {
    console.error('[chat/unread-count] error', e)
    return NextResponse.json({ success: false, error: 'Failed to compute unread count' }, { status: 500 })
  }
}