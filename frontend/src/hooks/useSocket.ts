// ============================================================
// OnboardRash — WebSocket Hook
// Connects to Flask-SocketIO, feeds events into Zustand stores
// ============================================================

import { useEffect } from 'react'
import { getSocket, connectSocket, disconnectSocket } from '@/lib/socket'
import { useEventStore } from '@/stores/useEventStore'
import { useUIStore } from '@/stores/useUIStore'
import type { DrivingEvent } from '@/lib/types'

export function useSocket() {
  const addAlert = useEventStore((s) => s.addAlert)
  const setConnected = useUIStore((s) => s.setConnected)

  useEffect(() => {
    const socket = getSocket()

    socket.on('connect', () => {
      console.log('⚡ WebSocket connected')
      setConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected')
      setConnected(false)
    })

    socket.on('connected', (data: { message: string }) => {
      console.log('Server:', data.message)
    })

    socket.on('new_alert', (event: DrivingEvent) => {
      console.log('🚨 New alert:', event)
      addAlert(event)
    })

    connectSocket()

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connected')
      socket.off('new_alert')
      disconnectSocket()
    }
  }, [addAlert, setConnected])
}
