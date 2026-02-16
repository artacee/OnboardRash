/**
 * FloatingButton — Apple visionOS-style Button with Shimmer Effect
 * 
 * Features:
 * - Glassmorphic material with backdrop blur
 * - Shimmer animation on hover (per frontend_implementation_guide.md)
 * - Spring physics for hover/tap interactions
 * - Ambient glow on hover
 * - Multiple variants: primary, secondary, danger
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="lg" rightIcon={<ArrowRight />}>
 *   Launch Dashboard
 * </Button>
 * ```
 */

import { useState } from 'react'
import { motion, type HTMLMotionProps, AnimatePresence } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface FloatingButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  /** Icon on the left side */
  icon?: ReactNode
  /** Alias for icon on the left */
  leftIcon?: ReactNode
  /** Icon on the right side */
  rightIcon?: ReactNode
  /** @deprecated Use leftIcon or rightIcon instead */
  iconPosition?: 'left' | 'right'
}

/** Variant styles for different button types */
const variantStyles = {
  primary: {
    background: 'var(--glass-t1-bg)',
    color: 'var(--text-primary)',
    border: 'var(--glass-t1-border)',
    hoverBg: 'rgba(255, 255, 255, 0.65)',
    hoverGlow: '0 0 20px rgba(102, 126, 234, 0.4), 0 0 40px rgba(102, 126, 234, 0.2)',
  },
  secondary: {
    background: 'rgba(0, 0, 0, 0.05)',
    color: 'var(--text-secondary)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    hoverBg: 'rgba(0, 0, 0, 0.08)',
    hoverGlow: '0 0 20px rgba(255, 255, 255, 0.2)',
  },
  danger: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--color-danger)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    hoverBg: 'rgba(239, 68, 68, 0.15)',
    hoverGlow: '0 0 20px rgba(239, 68, 68, 0.4)',
  }
}

/** Size styles for different button sizes */
const sizeStyles = {
  sm: { 
    padding: 'var(--space-2) var(--space-6)', 
    fontSize: 'var(--text-footnote)',
    minHeight: '36px'
  },
  md: { 
    padding: 'var(--space-3) var(--space-8)', 
    fontSize: 'var(--text-body)',
    minHeight: '44px'
  },
  lg: { 
    padding: 'var(--space-4) var(--space-10)', 
    fontSize: 'var(--text-callout)',
    minHeight: '52px'
  }
}

export default function FloatingButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  leftIcon,
  rightIcon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: FloatingButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Resolve icon positions (support both old and new API)
  const resolvedLeftIcon = leftIcon || (icon && iconPosition === 'left' ? icon : null)
  const resolvedRightIcon = rightIcon || (icon && iconPosition === 'right' ? icon : null)
  
  const styles = variantStyles[variant]
  const sizes = sizeStyles[size]

  return (
    <motion.button
      className={cn('floating-button', className)}
      onHoverStart={() => !disabled && setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={!disabled ? { 
        scale: 1.05,
        transition: { 
          type: 'spring', 
          stiffness: 400, 
          damping: 25,
          delay: 0.05 // 50ms hover delay per guide
        }
      } : {}}
      whileTap={!disabled ? { 
        scale: 0.97,
        transition: { type: 'spring', stiffness: 500, damping: 30 }
      } : {}}
      disabled={disabled}
      style={{
        background: styles.background,
        color: styles.color,
        border: styles.border,
        backdropFilter: 'var(--glass-t2-blur)',
        WebkitBackdropFilter: 'var(--glass-t2-blur)',
        borderRadius: 'var(--radius-full)',
        fontWeight: 'var(--weight-headline)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all var(--duration-normal) var(--ease-default)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        justifyContent: 'center',
        boxShadow: isHovered && !disabled ? styles.hoverGlow : 'none',
        ...sizes
      }}
      {...props}
    >
      {/* Left Icon */}
      {resolvedLeftIcon && (
        <motion.span 
          style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', zIndex: 1 }}
          animate={{ x: isHovered ? -2 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {resolvedLeftIcon}
        </motion.span>
      )}

      {/* Button Label */}
      <span className="button-label" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </span>

      {/* Right Icon */}
      {resolvedRightIcon && (
        <motion.span 
          style={{ display: 'inline-flex', alignItems: 'center', position: 'relative', zIndex: 1 }}
          animate={{ x: isHovered ? 3 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {resolvedRightIcon}
        </motion.span>
      )}

      {/* Shimmer Effect — Animated on Hover */}
      <AnimatePresence>
        {isHovered && !disabled && (
          <motion.span 
            className="button-shimmer"
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ 
              x: '100%', 
              opacity: 1,
              transition: { 
                x: { duration: 1.5, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 0.2 }
              }
            }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)',
              pointerEvents: 'none',
              zIndex: 0
            }}
          />
        )}
      </AnimatePresence>

      {/* Static Glow Layer (always present, opacity changes on hover) */}
      <motion.span 
        className="button-glow"
        animate={{ opacity: isHovered && !disabled ? 0.1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.3) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Specular Highlight (top edge) */}
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />
    </motion.button>
  )
}
