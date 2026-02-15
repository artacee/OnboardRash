// ============================================================
// GlassPanel — The signature glassmorphism container
// ============================================================

import { type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  variant?: 'default' | 'strong' | 'card'
  glow?: 'none' | 'crimson' | 'teal' | 'blue'
  noPadding?: boolean
}

export function GlassPanel({
  children,
  variant = 'default',
  glow = 'none',
  noPadding = false,
  className,
  ...props
}: GlassPanelProps) {
  const variantStyles = {
    default: 'glass',
    strong: 'glass-strong',
    card: 'glass-card',
  }

  const glowStyles = {
    none: '',
    crimson: 'shadow-[0_0_30px_rgba(220,38,38,0.15)]',
    teal: 'shadow-[0_0_30px_rgba(13,148,136,0.15)]',
    blue: 'shadow-[0_0_30px_rgba(59,130,246,0.15)]',
  }

  return (
    <motion.div
      className={cn(
        variantStyles[variant],
        glowStyles[glow],
        'rounded-xl',
        !noPadding && 'p-5',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
