import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ACCEPTED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file field is required' }, { status: 400 })

  if (!ACCEPTED_MIMES.has(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = mimeToExt(file.type)
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat')
  const filePath = path.join(uploadDir, fileName)

  await fs.mkdir(uploadDir, { recursive: true })
  await fs.writeFile(filePath, buffer)

  const url = `/uploads/chat/${fileName}`
  return NextResponse.json({ url, mime: file.type, size: file.size }, { status: 201 })
}

function mimeToExt(mime: string) {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return 'bin'
  }
}