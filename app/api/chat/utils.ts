import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export function json(data: any, init?: number | ResponseInit) {
  return NextResponse.json(data, init)
}

export function getAuthUserId(req: NextRequest): { userId: string } | { error: NextResponse } {
  const header = req.headers.get('authorization')
  const devUserId = req.headers.get('x-dev-user-id')
  const allowDev = process.env.NODE_ENV !== 'production'

  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7)
    const secret = process.env.JWT_SECRET
    if (!secret) return { error: json({ error: 'Server misconfigured' }, { status: 500 }) }
    try {
      const payload = jwt.verify(token, secret) as { sub?: string; userId?: string }
      const userId = payload.userId || payload.sub
      if (!userId) return { error: json({ error: 'Invalid token' }, { status: 401 }) }
      return { userId }
    } catch {
      return { error: json({ error: 'Unauthorized' }, { status: 401 }) }
    }
  }

  if (allowDev && devUserId) {
    return { userId: String(devUserId) }
  }

  return { error: json({ error: 'Unauthorized' }, { status: 401 }) }
}

export function parseQueryInt(value: string | null, def = 20, max = 100) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return def
  return Math.min(n, max)
}