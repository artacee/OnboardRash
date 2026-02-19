import type { ReactNode } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/cn'
import { scaleIn } from '@/utils/motion'

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  variant?: 'default' | 'elevated' | 'interactive' | 'subtle'
  animate?: boolean
  className?: string
}

export default function GlassCard({
  children,
  variant = 'default',
  animate = true,
  className,
  ...props
}: GlassCardProps) {
  const variantClasses = {
    default: '',
    elevated: 'glass-card--elevated',
    interactive: 'glass-card--interactive',
    subtle: 'glass-card--subtle'
  }

  const Component = animate ? motion.div : 'div'

  const motionProps = animate
    ? {
      initial: 'hidden',
      whileInView: 'visible',
      viewport: { once: true, amount: 0.2 },
      variants: scaleIn,
      ...props
    }
    : props

  return (
    <Component
      className={cn(
        'glass-card',
        variantClasses[variant],
        className
      )}
      {...(motionProps as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
    >
      {children}
    </Component>
  )
}
