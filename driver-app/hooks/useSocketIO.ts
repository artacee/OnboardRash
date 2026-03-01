/**
 * useSocketIO — React hook for real-time Socket.IO events.
 * 
 * Connects to the backend WebSocket and exposes subscribe/unsubscribe
 * for real-time driving event alerts. Replaces HTTP polling.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';

interface UseSocketIOReturn {
    isConnected: boolean;
    subscribe: (event: string, callback: (...args: any[]) => void) => () => void;
    unsubscribe: (event: string) => void;
    emit: (event: string, data?: any) => void;
}

export function useSocketIO(url: string): UseSocketIOReturn {
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const listenersRef = useRef<Map<string, (...args: any[]) => void>>(new Map());

    useEffect(() => {
        if (!url) return;

        const socket = io(url, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
            timeout: 10000,
        });

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('[SocketIO] Connected');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('[SocketIO] Disconnected');
        });

        socket.on('connect_error', (error) => {
            setIsConnected(false);
            console.warn('[SocketIO] Connection error:', error.message);
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
            listenersRef.current.clear();
        };
    }, [url]);

    const subscribe = useCallback((event: string, callback: (...args: any[]) => void) => {
        if (!socketRef.current) return () => {};

        socketRef.current.on(event, callback);
        listenersRef.current.set(event, callback);

        return () => {
            socketRef.current?.off(event, callback);
            listenersRef.current.delete(event);
        };
    }, []);

    const unsubscribe = useCallback((event: string) => {
        if (!socketRef.current) return;
        const cb = listenersRef.current.get(event);
        if (cb) {
            socketRef.current.off(event, cb);
            listenersRef.current.delete(event);
        }
    }, []);

    const emit = useCallback((event: string, data?: any) => {
        socketRef.current?.emit(event, data);
    }, []);

    return { isConnected, subscribe, unsubscribe, emit };
}
