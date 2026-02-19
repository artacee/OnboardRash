/**
 * useTilt — Cursor-Reactive Tilt Effect
 * 
 * Provides a perspective(1000px) rotateX/Y effect on mouse hover.
 * Creates the illusion that glass elements are physical objects
 * that respond to the user's cursor position.
 * 
 * Respects prefers-reduced-motion automatically.
 * 
 * Usage:
 *   const tilt = useTilt({ maxAngle: 6 })
 *   <div {...tilt.handlers} style={tilt.style}>...</div>
 */

import { useState, useCallback, useRef, useMemo, type CSSProperties } from 'react'
import { useReducedMotion } from 'framer-motion'

export interface TiltConfig {
    /** Maximum rotation angle in degrees (default: 6) */
    maxAngle?: number
    /** Transition speed in ms (default: 200) */
    speed?: number
    /** Scale factor on hover (default: 1.02) */
    scale?: number
}

export interface TiltResult {
    /** Spread these onto the target element */
    handlers: {
        onMouseMove: (e: React.MouseEvent<HTMLElement>) => void
        onMouseLeave: () => void
    }
    /** Apply this as the element's style (merges with existing) */
    style: CSSProperties
}

export function useTilt(config: TiltConfig = {}): TiltResult {
    const { maxAngle = 6, speed = 200, scale = 1.02 } = config
    const shouldReduceMotion = useReducedMotion()
    const ref = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
    const [tilt, setTilt] = useState({ x: 0, y: 0, active: false })

    const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if (shouldReduceMotion) return

        const el = e.currentTarget
        const rect = el.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        // Normalized position from -1 to 1
        const normalX = (e.clientX - centerX) / (rect.width / 2)
        const normalY = (e.clientY - centerY) / (rect.height / 2)

        // Clamp values
        const clampedX = Math.max(-1, Math.min(1, normalX))
        const clampedY = Math.max(-1, Math.min(1, normalY))

        ref.current = { x: clampedX, y: clampedY }
        setTilt({ x: clampedX, y: clampedY, active: true })
    }, [shouldReduceMotion])

    const onMouseLeave = useCallback(() => {
        ref.current = { x: 0, y: 0 }
        setTilt({ x: 0, y: 0, active: false })
    }, [])

    const style = useMemo<CSSProperties>(() => {
        if (shouldReduceMotion) return {}

        const rotateY = tilt.x * maxAngle
        const rotateX = -tilt.y * maxAngle
        const currentScale = tilt.active ? scale : 1

        return {
            transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${currentScale})`,
            transition: `transform ${speed}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            willChange: tilt.active ? 'transform' : 'auto',
        }
    }, [tilt.x, tilt.y, tilt.active, maxAngle, speed, scale, shouldReduceMotion])

    return {
        handlers: { onMouseMove, onMouseLeave },
        style,
    }
}
