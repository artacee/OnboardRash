import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface FloatingButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
}

export default function FloatingButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: FloatingButtonProps) {
  const variantStyles = {
    primary: {
      background: 'var(--glass-t1-bg)',
      color: 'var(--text-primary)',
      border: 'var(--glass-t1-border)'
    },
    secondary: {
      background: 'rgba(0, 0, 0, 0.05)',
      color: 'var(--text-secondary)',
      border: '1px solid rgba(0, 0, 0, 0.1)'
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: 'var(--color-danger)',
      border: '1px solid rgba(239, 68, 68, 0.2)'
    }
  }

  return (
    <motion.button
      className={cn('floating-button', className)}
      whileHover={!disabled ? { 
        scale: 1.05,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      } : {}}
      whileTap={!disabled ? { 
        scale: 0.98 
      } : {}}
      disabled={disabled}
      style={{
        ...variantStyles[variant],
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
        ...(size === 'sm' && { padding: 'var(--space-2) var(--space-6)', fontSize: 'var(--text-footnote)' }),
        ...(size === 'md' && { padding: 'var(--space-3) var(--space-8)', fontSize: 'var(--text-body)' }),
        ...(size === 'lg' && { padding: 'var(--space-4) var(--space-10)', fontSize: 'var(--text-callout)' })
      }}
      {...props}
    >
      {/* Icon (left) */}
      {icon && iconPosition === 'left' && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {icon}
        </span>
      )}

      {/* Button Label */}
      <span className="button-label" style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </span>

      {/* Icon (right) */}
      {icon && iconPosition === 'right' && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {icon}
        </span>
      )}

      {/* Button Glow (Shimmer Effect) */}
      <span 
        className="button-glow"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: 'linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
          pointerEvents: 'none'
        }}
      />
    </motion.button>
  )
}
