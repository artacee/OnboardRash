import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/utils/cn'

interface GlassInputProps extends Omit<HTMLMotionProps<'input'>, 'type'> {
  label?: string
  error?: string
  helperText?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      label,
      error,
      helperText,
      type = 'text',
      icon,
      iconPosition = 'left',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div style={{ width: '100%' }}>
        {/* Label */}
        {label && (
          <label
            style={{
              display: 'block',
              fontSize: 'var(--text-callout)',
              fontWeight: 'var(--weight-headline)',
              color: 'var(--text-secondary)',
              marginBottom: 'var(--space-2)',
              letterSpacing: '0.01em'
            }}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div style={{ position: 'relative', width: '100%' }}>
          {/* Icon (left) */}
          {icon && iconPosition === 'left' && (
            <div
              style={{
                position: 'absolute',
                left: 'var(--space-4)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                zIndex: 1
              }}
            >
              {icon}
            </div>
          )}

          {/* Input Field */}
          <motion.input
            ref={ref}
            type={type}
            className={cn('input-glass', className)}
            disabled={disabled}
            whileFocus={{
              scale: 1.01,
              transition: { duration: 0.2 }
            }}
            style={{
              width: '100%',
              background: 'var(--glass-t2-bg)',
              backdropFilter: 'var(--glass-t2-blur)',
              WebkitBackdropFilter: 'var(--glass-t2-blur)',
              border: error ? '1px solid var(--color-danger)' : 'var(--glass-t2-border)',
              borderRadius: 'var(--radius-md)',
              padding: icon
                ? iconPosition === 'left'
                  ? 'var(--space-3) var(--space-4) var(--space-3) var(--space-10)'
                  : 'var(--space-3) var(--space-10) var(--space-3) var(--space-4)'
                : 'var(--space-3) var(--space-4)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-body)',
              fontWeight: 'var(--weight-body)',
              transition: 'all var(--duration-fast) var(--ease-default)',
              cursor: disabled ? 'not-allowed' : 'text',
              opacity: disabled ? 0.5 : 1
            }}
            {...props}
          />

          {/* Icon (right) */}
          {icon && iconPosition === 'right' && (
            <div
              style={{
                position: 'absolute',
                right: 'var(--space-4)',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-tertiary)',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                zIndex: 1
              }}
            >
              {icon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: 'var(--space-2)',
              fontSize: 'var(--text-footnote)',
              color: 'var(--color-danger)',
              fontWeight: 'var(--weight-body)'
            }}
          >
            {error}
          </motion.p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <p
            style={{
              marginTop: 'var(--space-2)',
              fontSize: 'var(--text-footnote)',
              color: 'var(--text-tertiary)',
              fontWeight: 'var(--weight-body)'
            }}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

GlassInput.displayName = 'GlassInput'

export default GlassInput
