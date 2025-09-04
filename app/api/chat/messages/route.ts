import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getAuthUserId, json, parseQueryInt } from '../utils'

const HistorySchema = z.object({ chatRoomId: z.string().uuid() })

export async function GET(req: NextRequest) {
  const auth = getAuthUserId(req)
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(req.url)
  const chatRoomId = searchParams.get('chatRoomId')
  const take = parseQueryInt(searchParams.get('take'), 50, 100)
  const cursor = searchParams.get('cursor')

  if (!chatRoomId) return json({ error: 'chatRoomId required' }, { status: 400 })

  const room = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: { buyer: { select: { userId: true } }, seller: { select: { userId: true } } }
  })
  if (!room) return json({ error: 'Room not found' }, { status: 404 })
  if (room.buyer.userId !== auth.userId && room.seller.userId !== auth.userId) return json({ error: 'Forbidden' }, { status: 403 })

  const messages = await prisma.message.findMany({
    where: { chatRoomId },
    orderBy: { createdAt: 'desc' },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
  })
  return json({ messages })
}

const SendSchema = z.object({
  chatRoomId: z.string().uuid(),
  content: z.string().trim().max(2000).optional(),
  imageUrl: z.string().min(1).optional(),
  imageMime: z.string().optional(),
}).refine((d) => (d.content && d.content.trim().length > 0) || d.imageUrl, {
  message: 'Either content or imageUrl is required'
})

export async function POST(req: NextRequest) {
  const auth = getAuthUserId(req)
  if ('error' in auth) return auth.error

  const data = await req.json().catch(() => ({}))
  const parsed = SendSchema.safeParse(data)
  if (!parsed.success) return json({ error: 'Invalid payload' }, { status: 400 })

  const { chatRoomId, content = '', imageUrl, imageMime } = parsed.data

  const room = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: { buyer: { select: { userId: true } }, seller: { select: { userId: true } } }
  })
  if (!room) return json({ error: 'Room not found' }, { status: 404 })
  if (room.buyer.userId !== auth.userId && room.seller.userId !== auth.userId) return json({ error: 'Forbidden' }, { status: 403 })

  const saved = await prisma.message.create({
    data: {
      chatRoomId,
      senderId: auth.userId,
      content: content || '',
      imageUrl,
      imageMime
    }
  })
  return json(saved, { status: 201 })
}