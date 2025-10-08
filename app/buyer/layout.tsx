'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import BuyerNavbar from '@/components/custom/BuyerNavbar';
import { PrimeReactProvider } from 'primereact/api';
import { usePathname, useRouter } from 'next/navigation';
import Footer from '@/components/custom/Footer';
// Chat dependencies
import { useSocket } from '@/hooks/useSocket';
import axios from 'axios';
import clsx from 'clsx';
import { getUserData } from '@/lib/localStorage';
import { MessagesSquare } from 'lucide-react';

// ------------------------------------
// Types for chat entities
// ------------------------------------
interface ChatMessage {
  id: string;
  chatRoomId: string;
  content: string;
  senderId: string;
  isRead: boolean;
  createdAt: string | Date;
  optimistic?: boolean;
  // image fields
  imageUrl?: string | null;
  imageMime?: string | null;
}

interface ChatRoom {
  id: string;
  // add sellerId to enable direct opening by seller
  sellerId: string;
  // Seller information for displaying in chat list and conversation header
  seller?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    businessName?: string | null;
  };
  // Persisted pinned product compact info from API
  pinnedProduct?: {
    id: string;
    title: string;
    currency: string;
    price: number | string;
    thumbnail?: string | null;
  } | null;
}

interface ChatProductContext {
  productId: string;
  title: string;
  currency: string;
  price: number | string;
  thumbnail?: string | null;
  quantity?: number;
}

export default function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  // Check if current path is KYB form
  const isKybForm = pathname === '/seller/kyb-form';

  // ------------------------------------
  // Floating Chat Widget State and Logic
  // ------------------------------------
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const [roomProductContext, setRoomProductContext] = useState<Record<string, ChatProductContext>>({});
  // file input ref and uploading state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Add pendingImages state to hold selected images before upload
  // Each pending image stores the original File and a temporary object URL for preview
  type PendingImage = { file: File; previewUrl: string };
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  // Read optional devUserId from URL for local auth; fall back to localStorage user id Ivan Wong
  const devUserId = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const url = new URLSearchParams(window.location.search);
    const fromQuery = url.get('devUserId') || undefined;
    if (fromQuery) return fromQuery;
    try {
      // Only access localStorage on client side
      if (typeof window === 'undefined') return undefined;
      return getUserData()?.id;
    } catch {
      return undefined;
    }
  }, []);

  const { connected, joinRoom, sendMessage, on, markRead } = useSocket({ devUserId });

  // Memoized selected room for easy access to seller info in UI header
  const selectedRoom = useMemo(() => rooms.find((r) => r.id === selectedRoomId) || null, [rooms, selectedRoomId]);

  // Load rooms when widget opens (or when we need to refresh)
  useEffect(() => {
    if (!chatOpen || !devUserId) return;
    let cancelled = false;
    setRoomsLoading(true);
    setRoomsError(null);
    axios
      .get('/api/chat/rooms', { headers: { 'x-dev-user-id': devUserId } })
      .then((res) => {
        if (!cancelled) {
          const fetched = (res.data || []) as ChatRoom[];
          setRooms(fetched);
          // hydrate pinned product context per room so the header card persists across refresh
          setRoomProductContext((prev) => {
            const next = { ...prev } as Record<string, ChatProductContext>;
            for (const r of fetched) {
              if (r.pinnedProduct && r.id) {
                next[r.id] = {
                  productId: r.pinnedProduct.id,
                  title: r.pinnedProduct.title,
                  currency: r.pinnedProduct.currency,
                  price: r.pinnedProduct.price,
                  thumbnail: r.pinnedProduct.thumbnail ?? null,
                };
              }
            }
            return next;
          });
        }
      })
      .catch(() => {
        if (!cancelled) setRoomsError('Failed to load conversations');
      })
      .finally(() => {
        if (!cancelled) setRoomsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [chatOpen, devUserId]);

  // Join selected room and handle messages with de-duplication and optimistic replacement
  useEffect(() => {
    if (!selectedRoomId) return;
    joinRoom(selectedRoomId);

    // Subscribe: handle incoming messages; replace local optimistic copy when it's my own message and avoid duplicates by id
    const offNew = on('new_message', (...args: unknown[]) => {
      const msg = args[0] as ChatMessage;
      // Update unread badge if widget closed or message for a different room
      if (!chatOpen || msg.chatRoomId !== selectedRoomId) {
        setUnreadCount((n) => n + 1);
      }
      setMessages((prev) => {
        // Ignore if we already have this message by id
        if (prev.some((m) => m.id === msg.id)) return prev;

        // If this is my own message, try to replace the most recent optimistic one for this room
        if (msg.senderId === (devUserId || 'me')) {
          const reversed = [...prev].reverse();
          const relIdx = reversed.findIndex(
            (m) => m.optimistic && m.senderId === (devUserId || 'me') && m.chatRoomId === msg.chatRoomId
          );
          if (relIdx !== -1) {
            const arr = [...prev];
            const actualIndex = arr.length - 1 - relIdx;
            arr[actualIndex] = { ...msg, optimistic: false };
            return arr;
          }
        }

        // Otherwise just append
        return [...prev, msg];
      });
    });

    const offJoined = on('joined_room', () => {
      axios
        .get(`/api/chat/messages?chatRoomId=${selectedRoomId}`, { headers: { 'x-dev-user-id': devUserId || '' } })
        .then((res) => setMessages((res.data.messages as ChatMessage[]).reverse()));
    });

    const offRead = on('messages_read', (...args: unknown[]) => {
      const { messageIds } = args[0] as { messageIds: string[] };
      setMessages((prev) => prev.map((m) => (messageIds.includes(m.id) ? { ...m, isRead: true } : m)));
    });

    return () => {
      if (typeof offNew === 'function') offNew();
      if (typeof offJoined === 'function') offJoined();
      if (typeof offRead === 'function') offRead();
    };
  }, [selectedRoomId, devUserId, joinRoom, on, chatOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Send a message to the currently selected room with optimistic UI
  const handleSend = async () => {
    if (!selectedRoomId) return;
    const text = input.trim();
    // If nothing to send (no text and no images), bail
    if (!text && pendingImages.length === 0) return;

    // 1) Send text message first (if any) with optimistic UI
    if (text) {
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic: ChatMessage = {
        id: tempId,
        chatRoomId: selectedRoomId,
        content: text,
        senderId: devUserId || 'me',
        isRead: false,
        createdAt: new Date().toISOString(),
        optimistic: true,
      };
      setMessages((prev) => [...prev, optimistic]);
      setInput('');
      try {
        sendMessage({ chatRoomId: selectedRoomId, content: text });
      } catch (e) {
        // Revert optimistic on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setInput(text);
      }
    }

    // 2) Upload and send all pending images as individual messages
    if (pendingImages.length) {
      try {
        setUploading(true);
        const uploads = await Promise.all(
          pendingImages.map(async (item: PendingImage) => {
            const form = new FormData();
            form.append('file', item.file);
            const res = await fetch('/api/chat/upload', { method: 'POST', body: form });
            if (!res.ok) throw new Error('Upload failed');
            return (await res.json()) as { url: string; mime: string };
          })
        );

        // Inform socket to create one image message per uploaded image
        for (const data of uploads) {
          sendMessage({
            chatRoomId: selectedRoomId,
            imageUrl: data.url,
            imageMime: data.mime,
          });
        }

        // Clear previews and revoke object URLs
        setPendingImages((prev: PendingImage[]) => {
          prev.forEach((p: PendingImage) => URL.revokeObjectURL(p.previewUrl));
          return [] as PendingImage[];
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
   * Handle selecting one or more images from the user's device.
   * This function no longer uploads immediately. Instead, it builds
   * a temporary preview list. The actual upload happens when Send is clicked.
   */
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    // Reset input so selecting the same file again triggers change
    e.target.value = '';
    // Add selected files to preview queue
    setPendingImages((prev: PendingImage[]) => [
      ...prev,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
  };

  /** Remove a pending image from the preview strip by index. */
  const removePendingImage = (idx: number) => {
    setPendingImages((prev: PendingImage[]) => {
      const next = [...prev];
      const [removed] = next.splice(idx, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const formatPrice = (price: number | string | undefined) => {
    if (price === undefined || price === null) return '0.00';
    const n = Number(price);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  };

  const handleBuyNowFromChat = (ctx?: ChatProductContext) => {
    if (!ctx) return;
    const qty = ctx.quantity && Number(ctx.quantity) > 0 ? Number(ctx.quantity) : 1;
    router.push(`/buyer/checkout?productId=${ctx.productId}&quantity=${qty}`);
  };

  /**
   * Programmatically ensure a chat room with the provided seller exists
   * and return its id. If not found in current list, it will be created.
   */
  const ensureRoomForSeller = async (sellerId: string, pinnedProductId?: string): Promise<string | null> => {
    if (!devUserId) return null;
  
    // 1) If we already have this room in state, use it
    const existing = rooms.find((r) => r.sellerId === sellerId);
    if (existing) {
      // If we have a new pinned product and existing room lacks it, update context locally until server refresh
      if (pinnedProductId && !existing.pinnedProduct) {
        // Will be refreshed by GET /api/chat/rooms shortly; no-op here.
      }
      return existing.id;
    }
  
    try {
      // 2) Fetch current buyer profile id from userId
      const buyerRes = await axios.get(`/api/user/businessBuyer?userId=${devUserId}`);
      const buyerId: string | undefined = buyerRes.data?.data?.id;
      if (!buyerId) return null;
  
      // 3) Create or get the room; pass pinnedProductId so server persists it
      const roomRes = await axios.post(
        '/api/chat/rooms',
        { buyerId, sellerId, pinnedProductId },
        { headers: { 'x-dev-user-id': devUserId } }
      );
      const newId: string | undefined = roomRes.data?.id;
  
      // 4) Refresh rooms to include enriched seller info and pinned product for UI
      axios
        .get('/api/chat/rooms', { headers: { 'x-dev-user-id': devUserId } })
        .then((res) => setRooms((res.data || []) as ChatRoom[]))
        .catch(() => {});
  
      return newId || null;
    } catch {
      return null;
    }
  };

  // Mark last messages as read when viewing the room; also reset unread badge
  useEffect(() => {
    if (!messages.length || !selectedRoomId) return;
    const unread = messages.filter((m) => !m.isRead).map((m) => m.id).slice(-20);
    if (unread.length) markRead({ chatRoomId: selectedRoomId, messageIds: unread });
    // When the user is looking at the conversation, clear the unread badge
    if (chatOpen) setUnreadCount(0);
  }, [messages, selectedRoomId, markRead, chatOpen]);

  // Listen to a custom event dispatched from child pages to open chat with a seller
  useEffect(() => {
    const handleOpen = async (evt: Event) => {
      const e = evt as CustomEvent<{ sellerId: string; product?: { id: string; title: string; currency: string; price: number | string; thumbnail?: string | null; quantity?: number } }>;
      const sellerId = e?.detail?.sellerId;
      const product = e?.detail?.product;
      if (!sellerId) return;
      setChatOpen(true);
      const id = await ensureRoomForSeller(sellerId, product?.id);
      if (id) {
        setMessages([]);
        setSelectedRoomId(id);
        setUnreadCount(0);
        if (product) {
          setRoomProductContext((prev) => ({
            ...prev,
            [id]: {
              productId: product.id,
              title: product.title,
              currency: product.currency,
              price: product.price,
              thumbnail: product.thumbnail ?? null,
              quantity: product.quantity ? Number(product.quantity) : undefined,
            },
          }));
        } else if (rooms.length) {
          // If no product passed but server has pinnedProduct, hydrate from rooms
          const room = rooms.find((r) => r.id === id);
          if (room?.pinnedProduct && room.pinnedProduct.id) {
            setRoomProductContext((prev) => ({
              ...prev,
              [id]: {
                productId: room.pinnedProduct!.id,
                title: room.pinnedProduct!.title,
                currency: room.pinnedProduct!.currency,
                price: room.pinnedProduct!.price,
                thumbnail: room.pinnedProduct!.thumbnail ?? null,
              },
            }));
          }
        }
      }
    };

    window.addEventListener('buyer-chat:open', handleOpen as EventListener);
    return () => window.removeEventListener('buyer-chat:open', handleOpen as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devUserId, rooms]);

  // Listen for a custom event to open chat and send a message to a seller
  useEffect(() => {
    const handleSend = async (evt: Event) => {
      const e = evt as CustomEvent<{ sellerId: string; message: string; product?: { id: string; title: string; currency: string; price: number | string; thumbnail?: string | null; quantity?: number } }>;
      const sellerId = e?.detail?.sellerId;
      const message = e?.detail?.message?.trim();
      const product = e?.detail?.product;
      if (!sellerId || !message) return;
      setChatOpen(true);
      const id = await ensureRoomForSeller(sellerId, product?.id);
      if (id) {
        setSelectedRoomId(id);
        setUnreadCount(0);
        if (product) {
          setRoomProductContext((prev) => ({
            ...prev,
            [id]: {
              productId: product.id,
              title: product.title,
              currency: product.currency,
              price: product.price,
              thumbnail: product.thumbnail ?? null,
              quantity: product.quantity ? Number(product.quantity) : undefined,
            },
          }));
        }
        try {
          sendMessage({ chatRoomId: id, content: message });
        } catch (err) {
          console.error('Failed to send chat message', err);
        }
      }
    };

    window.addEventListener('buyer-chat:send', handleSend as EventListener);
    return () => window.removeEventListener('buyer-chat:send', handleSend as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devUserId, rooms]);

  // UI helpers
  const toggleChat = () => setChatOpen((o) => !o);
  const openRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setMessages([]);
    setChatOpen(true);
    setUnreadCount(0);
  };

  return (
    <>
      <PrimeReactProvider>
        <div className="flex h-screen">
          {/* Main Content Area */}
          <main 
            className={`flex-1 flex flex-col transition-all duration-300 ${
               !isKybForm 
            }`}
          >
            {/* Top Navbar - Only show if not on KYB form */}
            {!isKybForm && <BuyerNavbar />}
            
            {/* Page Content */}
            <div className="flex-1">
              {children}
            </div>
            <Footer />
          </main>
        </div>

        {/* Floating Chat Button */}
        <button
          aria-label="Chat"
          onClick={toggleChat}
          className="fixed cursor-pointer bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-green-800 text-white px-6 py-3 shadow-lg hover:bg-green-900 transition-colors"
        >
          {/* Chat icon */}
          <MessagesSquare className="w-5 h-5" />
          <span className="font-medium">Chat</span>
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs w-5 h-5">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Chat Window Overlay */}
        <div
          className={clsx(
            'fixed right-5 z-50 w-[92vw] max-w-[760px] h-[72vh] max-h-[680px] bg-white rounded-xl shadow-2xl border border-gray-200',
            'transition-transform duration-300 ease-out',
            chatOpen ? 'bottom-5 translate-y-0' : '-bottom-[80vh] translate-y-full'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="text-sm text-gray-600">{connected ? 'Online' : 'Offline'}</div>
            <button
              onClick={() => setChatOpen(false)}
              className="rounded p-1 hover:bg-gray-100"
              aria-label="Minimize"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 cursor-pointer">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
              </svg>
            </button>
          </div>

          {/* Body: Two-panel layout */}
          <div className="h-[calc(100%-40px)] flex">
            {/* Chat List Panel (Left) */}
            <div className="w-72 border-r h-full flex flex-col">
              <div className="p-3 border-b text-sm font-semibold">Chats</div>
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
                            {r.seller?.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={r.seller.avatarUrl}
                                alt={(r.seller?.name || 'Seller') + ' avatar'}
                                className="w-8 h-8 rounded-full object-cover border"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                                {(r.seller?.name?.[0] || 'S').toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{r.seller?.name || 'Seller'}</div>
                              <div className="text-xs text-gray-500 truncate">{r.seller?.businessName || ''}</div>
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
                  {/* Conversation Header: shows seller avatar and name */}
                  <div className="flex items-center gap-3 p-3 border-b bg-white/60">
                    {selectedRoom?.seller?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={selectedRoom.seller.avatarUrl}
                        alt={(selectedRoom?.seller?.name || 'Seller') + ' avatar'}
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                        {(selectedRoom?.seller?.name?.[0] || 'S').toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{selectedRoom?.seller?.name || 'Seller'}</div>
                      <div className="text-xs text-gray-500 truncate">{selectedRoom?.seller?.businessName || ''}</div>
                      {/* You can add presence/online status here if available */}
                    </div>
                  </div>

                  <div ref={listRef} className="flex-1 overflow-y-auto p-3 bg-gray-50">
                    {/* Sticky product context card at top when chat opened from a product */}
                    {selectedRoomId && roomProductContext[selectedRoomId] && (
                      <div className="sticky top-0 z-10 mb-2 bg-white border rounded p-2 shadow-sm">
                        <div className="flex items-center gap-3">
                          {roomProductContext[selectedRoomId].thumbnail ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={roomProductContext[selectedRoomId].thumbnail as string}
                              alt={roomProductContext[selectedRoomId].title}
                              className="w-10 h-10 rounded object-cover border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-xs text-gray-600">IMG</div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate">{roomProductContext[selectedRoomId].title}</div>
                            <div className="text-xs text-gray-600 truncate">{roomProductContext[selectedRoomId].currency} {formatPrice(roomProductContext[selectedRoomId].price)}</div>
                          </div>
                          <button
                            onClick={() => handleBuyNowFromChat(roomProductContext[selectedRoomId])}
                            className="text-xs px-3 py-1 bg-green-700 hover:bg-green-800 text-white rounded cursor-pointer"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    )}

                    {messages.map((m) => {
                      // Check if this is a quotation request message by looking for the signature
                      const isQuotationRequest = m.content?.includes('— Sent via CropDirect Request Quote feature');
                      // Quotation requests should appear left-aligned, other messages follow normal logic
                      const isFromCurrentUser = (m.senderId === (devUserId || 'me')) && !isQuotationRequest;
                      
                      return (
                        <div key={m.id} className={clsx('my-1', isFromCurrentUser ? 'text-right' : 'text-left')}>
                          <div className={clsx('inline-block px-3 py-2 rounded', isFromCurrentUser ? 'bg-green-100' : 'bg-white border')}>
                            {m.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.imageUrl} alt="image" className="max-w-[220px] max-h-[220px] rounded mb-1 object-cover" />
                            ) : null}
                            {m.content ? <div className="text-sm whitespace-pre-wrap break-words">{m.content}</div> : null}
                            <div className="text-[10px] text-gray-500">{new Date(m.createdAt).toLocaleTimeString()} {m.isRead ? '✓✓' : '✓'}</div>
                          </div>
                        </div>
                      );
                    })}
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
                              {/* X icon */}
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        {/* Add more button */}
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

                  <div className="p-3 border-t flex gap-2">
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                      className="flex-1 border rounded px-3 py-2"
                      placeholder="Type a message"
                    />
                    <input ref={fileInputRef} onChange={handleFileChange} type="file" accept="image/*" multiple className="hidden" />
                    <button
                      onClick={handleAttachClick}
                      disabled={uploading}
                      aria-label="Attach images"
                      className="px-3 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center"
                    >
                      {/* Image icon instead of text */}
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
      </PrimeReactProvider>
    </>
  );
}
