// ============================================================
// Button — Premium Awwwards-worthy button variants
// ============================================================

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const base = cn(
      'relative inline-flex items-center justify-center gap-2.5',
      'font-medium rounded-xl',
      'transition-all duration-500 ease-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-kerala-teal/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      'cursor-pointer select-none',
      'active:scale-[0.98]'
    )

    const variants = {
      primary: cn(
        'bg-gradient-to-r from-ksrtc-crimson via-ksrtc-glow to-ksrtc-crimson bg-[length:200%_100%]',
        'text-white font-semibold tracking-wide',
        'border border-white/10',
        'shadow-[0_4px_20px_rgba(220,38,38,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]',
        'hover:bg-[position:100%_0] hover:shadow-[0_8px_30px_rgba(220,38,38,0.4),inset_0_1px_0_rgba(255,255,255,0.15)]',
        'hover:-translate-y-0.5'
      ),
      secondary: cn(
        'glass border border-border-default',
        'text-text-primary font-medium',
        'hover:border-border-strong hover:bg-surface-1/50',
        'hover:-translate-y-0.5',
        'hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)]'
      ),
      ghost: cn(
        'text-text-secondary',
        'hover:text-text-primary hover:bg-surface-1/50',
        'rounded-lg'
      ),
      danger: cn(
        'bg-signal-critical/5 text-signal-critical',
        'border border-signal-critical/20',
        'hover:bg-signal-critical/10 hover:border-signal-critical/40',
        'hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]'
      ),
    }

    const sizes = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-8 py-3.5 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
