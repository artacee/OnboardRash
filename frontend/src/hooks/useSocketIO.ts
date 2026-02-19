import { useEffect, useState, useRef, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import type { ConnectionQuality, SocketIOHook } from '@/types'

export function useSocketIO(url: string): SocketIOHook {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('disconnected')
  const socketRef = useRef<Socket | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const listenersRef = useRef<Map<string, Function>>(new Map())

  useEffect(() => {
    // Create socket connection
    const socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socket.on('connect', () => {
      setIsConnected(true)
      setConnectionQuality('excellent')
      console.log('✅ WebSocket connected')
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
      setConnectionQuality('disconnected')
      console.log('❌ WebSocket disconnected')
    })

    socket.on('connect_error', (error) => {
      setConnectionQuality('poor')
      console.error('WebSocket error:', error)
    })

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [url])

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const subscribe = useCallback((event: string, callback: Function) => {
    if (!socketRef.current) return () => { /* empty */ }

    socketRef.current.on(event, callback as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    listenersRef.current.set(event, callback)

    return () => {
      socketRef.current?.off(event, callback as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      listenersRef.current.delete(event)
    }
  }, [])

  const unsubscribe = useCallback((event: string) => {
    if (!socketRef.current) return

    const callback = listenersRef.current.get(event)
    if (callback) {
      socketRef.current.off(event, callback as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      listenersRef.current.delete(event)
    }
  }, [])

  const emit = useCallback((event: string, data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    socketRef.current?.emit(event, data)
  }, [])

  return {
    isConnected,
    connectionQuality,
    subscribe,
    unsubscribe,
    emit
  }
}

// Export as alias for backwards compatibility
export { useSocketIO as useWebSocket }
