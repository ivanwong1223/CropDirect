"use client"
import { useEffect, useMemo, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface Options {
  token?: string
  devUserId?: string
}

export function useSocket({ token, devUserId }: Options) {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  const url = process.env.NEXT_PUBLIC_SOCKET_IO_URL || 'http://localhost:4000'

  useEffect(() => {
    const socket = io(url, {
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      auth: token ? { token } : (devUserId ? { devUserId } : {})
    })
    socketRef.current = socket

    function onConnect() { setConnected(true) }
    function onDisconnect() { setConnected(false) }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    // Helpful dev logs for diagnosing message send failures
    const onErrorEvent = (payload: unknown) => {
      console.error('[socket:error_event]', payload)
    }
    const onConnectError = (err: Error | unknown) => {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error('[socket:connect_error]', errorMessage)
    }
    socket.on('error_event', onErrorEvent)
    socket.on('connect_error', onConnectError)

    socket.connect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('error_event', onErrorEvent)
      socket.off('connect_error', onConnectError)
      socket.disconnect()
      socketRef.current = null
    }
  }, [token, devUserId, url])

  const api = useMemo(() => ({
    connected,
    socket: socketRef.current,
    joinRoom: (chatRoomId: string) => socketRef.current?.emit('join_room', { chatRoomId }),
    sendMessage: (data: { 
      chatRoomId?: string; 
      buyerId?: string; 
      sellerId?: string; 
      content?: string; 
      imageUrl?: string; 
      imageMime?: string; 
      metadata?: Record<string, unknown> 
    }) => socketRef.current?.emit('send_message', data),
    markRead: (data: { chatRoomId: string; messageIds: string[] }) => socketRef.current?.emit('message_read', data),
    on: (event: string, handler: (...args: unknown[]) => void) => {
      socketRef.current?.on(event, handler)
      return () => socketRef.current?.off(event, handler)
    }
  }), [connected])

  return api
}