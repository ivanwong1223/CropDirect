"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSocket } from '@/hooks/useSocket'
import axios from 'axios'
import clsx from 'clsx'
// Add: retrieve current user id from local storage so sidebar navigation works without URL params
import { getUserData } from '@/lib/localStorage'

// Define explicit types for chat entities to satisfy ESLint no-explicit-any
interface ChatMessage {
  id: string;
  chatRoomId: string;
  content: string;
  senderId: string;
  isRead: boolean;
  createdAt: string | Date;
  optimistic?: boolean;
  imageUrl?: string | null;
  imageMime?: string | null;
}

interface ChatRoom {
  id: string;
  buyerId: string;
  sellerId: string;
  buyer?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    businessName?: string | null;
  };
  pinnedProduct?: {
    id: string;
    title: string;
    currency: string;
    price: number | string;
    thumbnail?: string | null;
  } | null;
}
export default function SellerChatPage() {
  // Read initial params from URL
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const initialRoomId = params.get('chatRoomId') || ''
  const devUserId = params.get('devUserId') || undefined
  const buyerUserId = params.get('buyerUserId') || undefined
  const sellerUserId = params.get('sellerUserId') || undefined

  // Derive dev user id from local storage (development) if not provided via URL
  const devUserIdFromStorage = useMemo(() => {
    if (typeof window === 'undefined') return undefined
    try {
      return getUserData()?.id
    } catch {
      return undefined
    }
  }, [])
  const effectiveDevUserId = devUserId ?? devUserIdFromStorage

  // Track chatRoomId in state so we can update it after auto-creating a room
  const [chatRoomId, setChatRoomId] = useState(initialRoomId)

  const { connected, joinRoom, sendMessage, on, markRead } = useSocket({ devUserId: effectiveDevUserId })
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [pendingImages, setPendingImages] = useState<{ file: File; previewUrl: string }[]>([])

  // Maintain a list of rooms for this seller so /seller/chat works without query params
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [roomsLoading, setRoomsLoading] = useState(false)
  const [roomsError, setRoomsError] = useState<string | null>(null)

  // Selected room convenience vars for UI
  const selectedRoomId = chatRoomId
  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId), [rooms, selectedRoomId])

  const openRoom = (id: string) => {
    setChatRoomId(id)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('chatRoomId', id)
      window.history.replaceState({}, '', url.toString())
    }
  }

  // Load rooms for current user (seller) to populate sidebar list
  useEffect(() => {
    if (!effectiveDevUserId) return
    let cancelled = false
    setRoomsLoading(true)
    setRoomsError(null)
    axios
      .get('/api/chat/rooms', { headers: { 'x-dev-user-id': effectiveDevUserId } })
      .then((res) => {
        if (!cancelled) setRooms((res.data || []) as ChatRoom[])
      })
      .catch(() => {
        if (!cancelled) setRoomsError('Failed to load conversations')
      })
      .finally(() => {
        if (!cancelled) setRoomsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [effectiveDevUserId])

  // Auto-create a chat room in dev when chatRoomId is missing but buyerUserId & sellerUserId are provided
  // This helps end-to-end testing without needing to manually create a room first.
  useEffect(() => {
    if (chatRoomId || !effectiveDevUserId || !buyerUserId || !sellerUserId) return

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
          { headers: { 'x-dev-user-id': effectiveDevUserId } }
        )
        const newId = roomRes.data?.id
        if (!cancelled && newId) {
          setChatRoomId(newId)
          // Reflect in URL for shareable link
          const url = new URL(window.location.href)
          url.searchParams.set('chatRoomId', newId)
          window.history.replaceState({}, '', url.toString())
        }
      } catch (err) {
        
        console.error('Failed to auto-create chat room', err)
      }
    })()

    return () => { cancelled = true }
  }, [chatRoomId, effectiveDevUserId, buyerUserId, sellerUserId])

  useEffect(() => {
    if (!chatRoomId) return
    joinRoom(chatRoomId)

    // Subscribe: handle incoming messages; replace local optimistic copy when it's my own message and avoid duplicates by id
    const offNew = on('new_message', (msg: ChatMessage) => {
      setMessages((prev) => {
        // Ignore if we already have this message by id
        if (prev.some((m) => m.id === msg.id)) return prev

        // If this is my own message, try to replace the most recent optimistic one for this room
        if (msg.senderId === (effectiveDevUserId || 'me')) {
          const reversed = [...prev].reverse()
          const relIdx = reversed.findIndex(
            (m) => m.optimistic && m.senderId === (effectiveDevUserId || 'me') && m.chatRoomId === msg.chatRoomId
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
      axios
        .get(`/api/chat/messages?chatRoomId=${chatRoomId}`, { headers: { 'x-dev-user-id': effectiveDevUserId || '' } })
        .then((res) => setMessages((res.data.messages as ChatMessage[]).reverse()))
    })
    const offRead = on('messages_read', ({ messageIds }: { messageIds: string[] }) => {
      setMessages((prev) => prev.map((m) => (messageIds.includes(m.id) ? { ...m, isRead: true } : m)))
    })
    const offError = on('error_event', (err) => {
      // Surface socket/server errors during development for easier debugging
      
      console.error('[socket error]', err)
    })

    return () => {
      if (typeof offNew === 'function') offNew()
      if (typeof offJoined === 'function') offJoined()
      if (typeof offRead === 'function') offRead()
      if (typeof offError === 'function') offError()
    }
  }, [chatRoomId, effectiveDevUserId, joinRoom, on])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  /**
   * handleSend: Sends a message with optimistic UI update and uploads any pending images.
   * Text (if any) is sent first; images selected via the picker are uploaded and sent
   * as individual messages only when Send is clicked.
   */
  const handleSend = async () => {
    if (!chatRoomId) return;
    const text = input.trim();
    if (!text && pendingImages.length === 0) return;

    // Send text message first if present
    if (text) {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic: ChatMessage = {
        id: tempId,
        chatRoomId,
        content: text,
        senderId: effectiveDevUserId || 'me',
        isRead: false,
        createdAt: new Date().toISOString(),
        optimistic: true,
      };
      setMessages((prev) => [...prev, optimistic]);
      setInput('');
      try {
        sendMessage({ chatRoomId, content: text });
      } catch (e) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(text);
      }
    }

    // Upload and send any pending images
    if (pendingImages.length) {
      try {
        setUploading(true);
        const uploads = await Promise.all(
          pendingImages.map(async (item) => {
            const form = new FormData();
            form.append('file', item.file);
            const res = await fetch('/api/chat/upload', { method: 'POST', body: form });
            if (!res.ok) throw new Error('Upload failed');
            return (await res.json()) as { url: string; mime: string; size: number };
          })
        );

        for (const data of uploads) {
          sendMessage({ chatRoomId, imageUrl: data.url, imageMime: data.mime });
        }

        // Clear previews and revoke URLs
        setPendingImages((prev) => {
          prev.forEach((p) => URL.revokeObjectURL(p.previewUrl));
          return [];
        });
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleAttachClick = () => fileInputRef.current?.click();

  /**
   * Build a temporary preview list from selected images. Do not upload yet.
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    e.target.value = '';
    setPendingImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
  };

  /** Remove one image from the pending preview strip. */
  const removePendingImage = (idx: number) => {
    setPendingImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  useEffect(() => {
    if (!messages.length || !chatRoomId) return
    const unread = messages.filter(m => !m.isRead).map(m => m.id).slice(-20)
    if (unread.length) markRead({ chatRoomId, messageIds: unread })
  }, [messages, chatRoomId, markRead])



  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="h-[77vh] border rounded-lg overflow-hidden flex bg-white/70">
        {/* Chat List Panel (Left) */}
        <div className="w-72 border-r h-full flex flex-col">
          <div className="p-3 border-b text-sm font-semibold flex items-center justify-between">
            <span>Chats</span>
            <span className={clsx('text-xs', connected ? 'text-green-700' : 'text-gray-500')}>{connected ? 'Online' : 'Offline'}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {roomsLoading && <div className="p-3 text-sm text-gray-500">Loading conversations…</div>}
            {roomsError && <div className="p-3 text-sm text-red-600">{roomsError}</div>}
            {!roomsLoading && !roomsError && (
              rooms.length ? (
                <div className="divide-y">
                  {rooms.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => openRoom(r.id)}
                      className={clsx(
                        'w-full text-left p-3 hover:bg-gray-50 focus:bg-gray-50',
                        selectedRoomId === r.id && 'bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {r.buyer?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.buyer.avatarUrl}
                            alt={(r.buyer?.name || 'Buyer') + ' avatar'}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                            {(r.buyer?.name?.[0] || 'B').toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{r.buyer?.name || 'Buyer'}</div>
                          <div className="text-xs text-gray-500 truncate">{r.buyer?.businessName || ''}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-sm text-gray-500">No conversations yet.</div>
              )
            )}
          </div>
        </div>

        {/* Conversation Panel (Right) */}
        <div className="flex-1 h-full flex flex-col">
          {!selectedRoomId ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
              Select a conversation to start messaging
            </div>
          ) : (
            <>
              {/* Conversation Header: shows buyer avatar and name */}
              <div className="flex items-center gap-3 p-3 border-b bg-white/60">
                {selectedRoom?.buyer?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedRoom.buyer.avatarUrl}
                    alt={(selectedRoom?.buyer?.name || 'Buyer') + ' avatar'}
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                    {(selectedRoom?.buyer?.name?.[0] || 'B').toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{selectedRoom?.buyer?.name || 'Buyer'}</div>
                  <div className="text-xs text-gray-500 truncate">{selectedRoom?.buyer?.businessName || ''}</div>
                </div>
              </div>

              <div ref={listRef} className="flex-1 overflow-y-auto p-3 bg-gray-50">
                {/* Sticky product context card when room has pinned product */}
                {selectedRoom?.pinnedProduct && (
                  <div className="sticky top-0 z-10 mb-2 bg-white border rounded p-2 shadow-sm">
                    <div className="flex items-center gap-3">
                      {selectedRoom.pinnedProduct.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedRoom.pinnedProduct.thumbnail}
                          alt={selectedRoom.pinnedProduct.title}
                          className="w-10 h-10 rounded object-cover border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-600">IMG</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{selectedRoom.pinnedProduct.title}</div>
                        <div className="text-xs text-gray-600 truncate">{selectedRoom.pinnedProduct.currency} {selectedRoom.pinnedProduct.price}</div>
                      </div>
                      <div className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded">
                        Product
                      </div>
                    </div>
                  </div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className={clsx('my-1', (m.senderId === (effectiveDevUserId || 'me')) ? 'text-right' : 'text-left')}>
                    <div className={clsx('inline-block px-3 py-2 rounded', (m.senderId === (effectiveDevUserId || 'me')) ? 'bg-green-100' : 'bg-white border')}>
                      {m.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.imageUrl} alt="image" className="max-w-[220px] max-h-[220px] rounded mb-1 object-cover" />
                      ) : null}
                      {m.content ? <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div> : null}
                      <div className="text-[10px] text-gray-500">{new Date(m.createdAt).toLocaleTimeString()} {m.isRead ? '✓✓' : '✓'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pending image previews shown before sending */}
              {pendingImages.length > 0 && (
                <div className="px-3 pt-2 pb-0 border-t bg-white">
                  <div className="flex gap-2 flex-wrap">
                    {pendingImages.map((p, idx) => (
                      <div key={idx} className="relative w-16 h-16 border rounded overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.previewUrl} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          aria-label="Remove image"
                          onClick={() => removePendingImage(idx)}
                          className="absolute -right-2 -top-2 bg-white border rounded-full p-0.5 shadow hover:bg-gray-50"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleAttachClick}
                      className="w-16 h-16 border rounded flex items-center justify-center text-gray-500 hover:bg-gray-50"
                      aria-label="Add more images"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Composer */}
              <div className="mt-0 p-3 flex gap-2 border-t bg-white">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                  className="flex-1 border rounded px-3 py-2"
                  placeholder="Type a message"
                />
                <input ref={fileInputRef} onChange={handleFileChange} type="file" accept="image/*" multiple className="hidden" />
                <button onClick={handleAttachClick} disabled={uploading} aria-label="Attach images" className="px-3 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <rect x="3" y="3" width="18" height="14" rx="2" ry="2"></rect>
                    <circle cx="7.5" cy="7.5" r="1.5"></circle>
                    <path d="M21 15l-5-5a2 2 0 0 0-2.83 0L5 18" />
                  </svg>
                </button>
                <button onClick={handleSend} className="px-4 py-2 bg-green-600 text-white rounded">Send</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}