// ============================================================
// GlassPanel — Premium glassmorphism container
// ============================================================

import { type ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  variant?: 'default' | 'strong' | 'card'
  glow?: 'none' | 'crimson' | 'teal' | 'blue'
  noPadding?: boolean
  hud?: boolean
}

export function GlassPanel({
  children,
  variant = 'default',
  glow = 'none',
  noPadding = false,
  hud = false,
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
    crimson: 'shadow-[0_0_40px_rgba(220,38,38,0.2),inset_0_0_20px_rgba(220,38,38,0.05)]',
    teal: 'shadow-[0_0_40px_rgba(20,184,166,0.2),inset_0_0_20px_rgba(20,184,166,0.05)]',
    blue: 'shadow-[0_0_40px_rgba(96,165,250,0.2),inset_0_0_20px_rgba(96,165,250,0.05)]',
  }

  return (
    <motion.div
      className={cn(
        'relative',
        variantStyles[variant],
        glowStyles[glow],
        'rounded-xl',
        !noPadding && 'p-5',
        hud && 'hud-corner',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
