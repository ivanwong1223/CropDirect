import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'
import prisma from '../lib/prisma'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(helmet())
app.use(express.json())
app.use(cookieParser())

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : '*', credentials: false }))

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: allowedOrigins.length ? allowedOrigins : '*',
    credentials: false
  }
})

// In-memory user <-> socket mapping and basic rate limiting per socket
const userSockets = new Map<string, Set<string>>()
const rateWindowMs = 30_000
const maxMsgsPerWindow = 20
const sendRateState = new Map<string, { start: number; count: number }>()

function rateLimit(socketId: string) {
  const now = Date.now()
  const state = sendRateState.get(socketId)
  if (!state) {
    sendRateState.set(socketId, { start: now, count: 1 })
    return true
  }
  if (now - state.start > rateWindowMs) {
    sendRateState.set(socketId, { start: now, count: 1 })
    return true
  }
  if (state.count >= maxMsgsPerWindow) return false
  state.count += 1
  return true
}

function attachSocket(userId: string, socketId: string) {
  const set = userSockets.get(userId) || new Set<string>()
  set.add(socketId)
  userSockets.set(userId, set)
}
function detachSocket(userId: string, socketId: string) {
  const set = userSockets.get(userId)
  if (!set) return
  set.delete(socketId)
  if (set.size === 0) userSockets.delete(userId)
}

// Auth middleware
io.use((socket, next) => {
  try {
    const auth = socket.handshake.auth || {}
    const headerToken = (socket.handshake.headers?.authorization as string | undefined)?.split(' ')[1]
    const token: string | undefined = auth.token || headerToken
    const allowDev = process.env.NODE_ENV !== 'production'

    if (!token) {
      if (allowDev && auth.devUserId) {
        socket.data.userId = String(auth.devUserId)
        return next()
      }
      return next(new Error('Unauthorized: missing token'))
    }
    const secret = process.env.JWT_SECRET
    if (!secret) return next(new Error('Server misconfigured: missing JWT_SECRET'))

    const payload = jwt.verify(token, secret) as { sub?: string; userId?: string }
    const userId = payload.userId || payload.sub
    if (!userId) return next(new Error('Unauthorized: invalid token payload'))
    socket.data.userId = userId
    return next()
  } catch (err) {
    return next(new Error('Unauthorized'))
  }
})

const SendMessageSchema = z.object({
  chatRoomId: z.string().uuid().optional(),
  buyerId: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
  content: z.string().trim().max(2000).optional(),
  imageUrl: z.string().min(1).optional(),
  imageMime: z.string().optional(),
  metadata: z.record(z.any()).optional()
}).refine((d) => !!d.chatRoomId || (!!d.buyerId && !!d.sellerId), {
  message: 'Provide chatRoomId or buyerId+sellerId'
}).refine((d) => (d.content && d.content.trim().length > 0) || d.imageUrl, {
  message: 'Either content or imageUrl is required'
})

const JoinRoomSchema = z.object({ chatRoomId: z.string().uuid() })

const ReadSchema = z.object({ chatRoomId: z.string().uuid(), messageIds: z.array(z.string().uuid()).min(1) })

async function ensureChatRoomAuthorized(buyerId: string, sellerId: string, requesterUserId: string) {
  const [buyer, seller] = await Promise.all([
    prisma.businessBuyer.findUnique({ where: { id: buyerId }, select: { userId: true } }),
    prisma.agribusiness.findUnique({ where: { id: sellerId }, select: { userId: true } }),
  ])
  if (!buyer || !seller) throw new Error('Invalid participants')
  if (buyer.userId !== requesterUserId && seller.userId !== requesterUserId) throw new Error('Forbidden')
  let room = await prisma.chatRoom.findFirst({ where: { buyerId, sellerId } })
  if (!room) room = await prisma.chatRoom.create({ data: { buyerId, sellerId } })
  return room
}

async function userInRoom(userId: string, chatRoomId: string) {
  const room = await prisma.chatRoom.findUnique({
    where: { id: chatRoomId },
    include: {
      buyer: { select: { userId: true } },
      seller: { select: { userId: true } }
    }
  })
  if (!room) return { ok: false as const, error: 'Room not found' }
  const ok = room.buyer.userId === userId || room.seller.userId === userId
  return ok ? { ok: true as const, room } : { ok: false as const, error: 'Forbidden' }
}

io.on('connection', (socket) => {
  const userId = socket.data.userId as string
  attachSocket(userId, socket.id)

  socket.on('disconnect', () => {
    detachSocket(userId, socket.id)
  })

  socket.on('join_room', async (raw) => {
    try {
      const { chatRoomId } = JoinRoomSchema.parse(raw)
      const check = await userInRoom(userId, chatRoomId)
      if (!check.ok) return socket.emit('error_event', { type: 'join_room_error', message: check.error })
      await socket.join(chatRoomId)
      socket.emit('joined_room', { chatRoomId })
    } catch (e) {
      socket.emit('error_event', { type: 'join_room_error' })
    }
  })

  socket.on('send_message', async (raw) => {
    if (!rateLimit(socket.id)) return socket.emit('error_event', { type: 'rate_limited', message: 'Too many messages, slow down.' })
    try {
      const payload = SendMessageSchema.parse(raw)
      let chatRoomId = payload.chatRoomId
      if (!chatRoomId && payload.buyerId && payload.sellerId) {
        const room = await ensureChatRoomAuthorized(payload.buyerId, payload.sellerId, userId)
        chatRoomId = room.id
      }
      if (!chatRoomId) throw new Error('No chat room context')

      const check = await userInRoom(userId, chatRoomId)
      if (!check.ok) return socket.emit('error_event', { type: 'send_message_error', message: check.error })

      const saved = await prisma.message.create({
        data: {
          chatRoomId,
          senderId: userId,
          content: payload.content || '',
          imageUrl: payload.imageUrl,
          imageMime: payload.imageMime
        }
      })

      io.to(chatRoomId).emit('new_message', saved)
    } catch (e) {
      socket.emit('error_event', { type: 'send_message_error' })
    }
  })

  socket.on('message_read', async (raw) => {
    try {
      const { chatRoomId, messageIds } = ReadSchema.parse(raw)
      const check = await userInRoom(userId, chatRoomId)
      if (!check.ok) return socket.emit('error_event', { type: 'message_read_error', message: check.error })

      await prisma.message.updateMany({
        where: { id: { in: messageIds }, chatRoomId, senderId: { not: userId }, isRead: false },
        data: { isRead: true }
      })

      socket.to(chatRoomId).emit('messages_read', { chatRoomId, messageIds })
      socket.emit('messages_read_ack', { chatRoomId, messageIds })
    } catch (e) {
      socket.emit('error_event', { type: 'message_read_error' })
    }
  })
})

const port = Number(process.env.SOCKET_IO_PORT || 4000)
server.listen(port, () => {
  console.log(`[socket] listening on http://localhost:${port}`)
})

// Health endpoint for monitoring
app.get('/health', (_req, res) => res.status(200).send('ok'))