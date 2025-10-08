"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSocket } from '@/hooks/useSocket'
import axios from 'axios'
import clsx from 'clsx'

interface ChatMessage {
  id: string
  chatRoomId: string
  content: string
  senderId: string
  isRead: boolean
  createdAt: string | Date
  optimistic?: boolean
}

interface ChatRoom {
  id: string
}

// Demo: accept chatRoomId via query ?chatRoomId=... and devUserId for local auth
export default function BuyerChatPage() {
  // Read initial params from URL
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const initialRoomId = params.get('chatRoomId') || ''
  const devUserId = params.get('devUserId') || undefined
  const buyerUserId = params.get('buyerUserId') || undefined
  const sellerUserId = params.get('sellerUserId') || undefined

  // Track chatRoomId in state so we can update it after auto-creating a room
  const [chatRoomId, setChatRoomId] = useState(initialRoomId)

  const { connected, joinRoom, sendMessage, on, markRead } = useSocket({ devUserId })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-create a chat room in dev when chatRoomId is missing but buyerUserId & sellerUserId are provided
  // This helps end-to-end testing without needing to manually create a room first.
  useEffect(() => {
    if (chatRoomId || !devUserId || !buyerUserId || !sellerUserId) return

    let cancelled = false
    ;(async () => {
      try {
        const [buyerRes, sellerRes] = await Promise.all([
          axios.get(`/api/user/businessBuyer?userId=${buyerUserId}`),
          axios.get(`/api/user/agribusiness?userId=${sellerUserId}`),
        ])
        const buyerId = buyerRes.data?.data?.id
        const sellerId = sellerRes.data?.data?.id
        if (!buyerId || !sellerId) return

        const roomRes = await axios.post(
          '/api/chat/rooms',
          { buyerId, sellerId },
          { headers: { 'x-dev-user-id': devUserId } }
        )
        const newId = roomRes.data?.id
        if (!cancelled && newId) {
          setChatRoomId(newId)
          // Reflect in URL for shareable link (client-side only)
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set('chatRoomId', newId)
            window.history.replaceState({}, '', url.toString())
          }
        }
      } catch (err) {
        console.error('Failed to auto-create chat room', err)
      }
    })()

    return () => { cancelled = true }
  }, [chatRoomId, devUserId, buyerUserId, sellerUserId])

  useEffect(() => {
    if (!chatRoomId) return
    joinRoom(chatRoomId)

    // Subscribe: handle incoming messages; replace local optimistic copy when it's my own message and avoid duplicates by id
    const offNew = on('new_message', (...args: unknown[]) => {
      const msg = args[0] as ChatMessage;
      setMessages((prev) => {
        // Ignore if we already have this message by id
        if (prev.some((m) => m.id === msg.id)) return prev

        // If this is my own message, try to replace the most recent optimistic one for this room
        if (msg.senderId === (devUserId || 'me')) {
          const reversed = [...prev].reverse()
          const relIdx = reversed.findIndex(
            (m) => m.optimistic && m.senderId === (devUserId || 'me') && m.chatRoomId === msg.chatRoomId
          )
          if (relIdx !== -1) {
            const arr = [...prev]
            const actualIndex = arr.length - 1 - relIdx
            arr[actualIndex] = { ...msg, optimistic: false }
            return arr
          }
        }

        // Otherwise just append
        return [...prev, msg]
      })
    })
    const offJoined = on('joined_room', () => {
      // fetch history once joined
      axios
        .get(`/api/chat/messages?chatRoomId=${chatRoomId}`, { headers: { 'x-dev-user-id': devUserId || '' } })
        .then((res) => setMessages((res.data.messages as ChatMessage[]).reverse()))
    })
    const offRead = on('messages_read', (...args: unknown[]) => {
      const { messageIds } = args[0] as { messageIds: string[] };
      setMessages((prev) => prev.map((m) => (messageIds.includes(m.id) ? { ...m, isRead: true } : m)))
    })

    return () => {
      if (typeof offNew === 'function') offNew()
      if (typeof offJoined === 'function') offJoined()
      if (typeof offRead === 'function') offRead()
    }
  }, [chatRoomId, devUserId, joinRoom, on])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  /**
   * handleSend: Sends a message with optimistic UI update.
   * We add a temporary message to the list for instant feedback; the 'new_message'
   * subscription above will replace it with the server-acknowledged message to avoid duplicates.
   */
  const handleSend = () => {
    if (!input.trim() || !chatRoomId) return
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      chatRoomId,
      content: input,
      senderId: (devUserId || 'me') as string,
      isRead: false,
      createdAt: new Date().toISOString(),
      optimistic: true,
    }
    setMessages((prev) => [...prev, optimistic])
    sendMessage({ chatRoomId, content: input })
    setInput('')
  }

  // mark last 20 messages as read when connect
  useEffect(() => {
    if (!messages.length || !chatRoomId) return
    const unread = messages.filter(m => !m.isRead).map(m => m.id).slice(-20)
    if (unread.length) markRead({ chatRoomId, messageIds: unread })
  }, [messages, chatRoomId, markRead])

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-2">Buyer Chat {connected ? '• Online' : '• Offline'}</h1>
      <div ref={listRef} className="border rounded p-2 h-[60vh] overflow-y-auto bg-white">
        {messages.map((m) => (
          <div key={m.id} className={clsx('my-1', (m.senderId === (devUserId || 'me')) ? 'text-right' : 'text-left')}>
            <div className={clsx('inline-block px-3 py-2 rounded', (m.senderId === (devUserId || 'me')) ? 'bg-green-100' : 'bg-gray-100')}>
              <div className="text-sm">{m.content}</div>
              <div className="text-[10px] text-gray-500">{new Date(m.createdAt).toLocaleTimeString()} {m.isRead ? '✓✓' : '✓'}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 border rounded px-3 py-2" placeholder="Type a message" />
        <button onClick={handleSend} className="px-4 py-2 bg-green-600 text-white rounded">Send</button>
      </div>
    </div>
  )
}