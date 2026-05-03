import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function useSocket({ room, event, onMessage, enabled = true }) {
  const socketRef = useRef(null)

  useEffect(() => {
    if (!enabled || !room) return
    const token = sessionStorage.getItem('access_token')
    const socket = io(SOCKET_URL, { transports: ['websocket'], auth: { token } })
    socketRef.current = socket
    socket.on('connect', () => socket.emit('join_room', { room }))
    socket.on(event, (data) => onMessage?.(data))
    socket.on('connect_error', (err) => console.warn('Socket error:', err.message))
    return () => { socket.emit('leave_room', { room }); socket.disconnect() }
  }, [room, event, enabled])

  return socketRef
}
