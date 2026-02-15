// ============================================================
// AnimatedCounter — Spring-physics number animation
// ============================================================

import { useEffect, useRef } from 'react'
import { useSpring, useMotionValue, motion, useTransform } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  className?: string
  duration?: number
}

export function AnimatedCounter({ value, className, duration = 0.8 }: AnimatedCounterProps) {
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  })
  const display = useTransform(springValue, (v) => Math.round(v))
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    motionValue.set(value)
  }, [value, motionValue])

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = String(v)
      }
    })
    return unsubscribe
  }, [display])

  return <motion.span ref={ref} className={className} />
}
