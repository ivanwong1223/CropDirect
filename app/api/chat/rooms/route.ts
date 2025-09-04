import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getAuthUserId, json } from '../utils'

const CreateOrGetSchema = z.object({ buyerId: z.string().uuid(), sellerId: z.string().uuid(), pinnedProductId: z.string().uuid().optional() })

export async function POST(req: NextRequest) {
  const auth = getAuthUserId(req)
  if ('error' in auth) return auth.error

  const body = await req.json().catch(() => ({}))
  const parsed = CreateOrGetSchema.safeParse(body)
  if (!parsed.success) return json({ error: 'Invalid payload' }, { status: 400 })

  const { buyerId, sellerId, pinnedProductId } = parsed.data

  // Ensure requester is buyer or seller's user
  const buyer = await prisma.businessBuyer.findUnique({ where: { id: buyerId } })
  const seller = await prisma.agribusiness.findUnique({ where: { id: sellerId } })
  if (!buyer || !seller) return json({ error: 'Invalid participants' }, { status: 404 })

  const userId = auth.userId
  if (buyer.userId !== userId && seller.userId !== userId) return json({ error: 'Forbidden' }, { status: 403 })

  let room = await prisma.chatRoom.findFirst({ where: { buyerId, sellerId } })
  if (!room) {
    room = await prisma.chatRoom.create({ data: { buyerId, sellerId, pinnedProductId: pinnedProductId || null } })
  } else if (pinnedProductId && room.pinnedProductId !== pinnedProductId) {
    // Update pinned product when creating a room from a specific product
    room = await prisma.chatRoom.update({ where: { id: room.id }, data: { pinnedProductId } })
  }
  return json(room)
}

/**
 * GET /api/chat/rooms
 * Lists all chat rooms for the authenticated user (buyer or seller).
 * Additionally enriches each room with seller details resolved from relations:
 * - seller.user.name -> seller name to display
 * - seller.businessImage -> avatar image for UI
 * - seller.businessName -> secondary label under the name
 * Also returns pinned product details for persistent product card in chat UI.
 */
export async function GET(req: NextRequest) {
  const auth = getAuthUserId(req)
  if ('error' in auth) return auth.error

  // List rooms for user with necessary relations to build UI-facing data
  const rooms = await prisma.chatRoom.findMany({
    where: {
      OR: [
        { buyer: { userId: auth.userId } },
        { seller: { userId: auth.userId } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: {
      seller: {
        select: {
          id: true,
          userId: true,
          businessName: true,
          businessImage: true,
          user: { select: { name: true } }
        }
      },
      // Include buyer details for seller UI to display opponent info
      buyer: {
        select: {
          id: true,
          userId: true,
          businessImage: true,
          companyName: true,
          user: { select: { name: true } }
        }
      },
      pinnedProduct: {
        select: {
          id: true,
          productTitle: true,
          currency: true,
          pricing: true,
          productImages: true,
        }
      }
    }
  })

  // Map to a compact shape expected by the chat widgets (buyer and seller)
  const mapped = rooms.map((r) => ({
    id: r.id,
    buyerId: r.buyerId,
    sellerId: r.sellerId,
    createdAt: r.createdAt,
    seller: {
      id: r.seller.id,
      name: r.seller.user?.name ?? 'Seller',
      avatarUrl: r.seller.businessImage ?? null,
      businessName: r.seller.businessName ?? null,
    },
    buyer: {
      id: r.buyer.id,
      name: r.buyer.user?.name ?? 'Buyer',
      avatarUrl: r.buyer.businessImage ?? null,
      businessName: r.buyer.companyName ?? null,
    },
    pinnedProduct: r.pinnedProduct
      ? {
          id: r.pinnedProduct.id,
          title: r.pinnedProduct.productTitle,
          currency: r.pinnedProduct.currency,
          price: r.pinnedProduct.pricing,
          thumbnail: r.pinnedProduct.productImages?.[0] ?? null,
        }
      : null,
  }))

  return json(mapped)
}