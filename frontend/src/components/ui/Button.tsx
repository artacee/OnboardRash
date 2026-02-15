// ============================================================
// Button — Styled button variants
// ============================================================

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-kerala-teal/50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

    const variants = {
      primary:
        'bg-gradient-to-r from-ksrtc-crimson to-ksrtc-glow text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:-translate-y-0.5 active:translate-y-0',
      secondary:
        'glass text-text-primary hover:border-border-strong hover:-translate-y-0.5 active:translate-y-0',
      ghost:
        'text-text-secondary hover:text-text-primary hover:bg-surface-1',
      danger:
        'bg-signal-critical/10 text-signal-critical border border-signal-critical/30 hover:bg-signal-critical/20',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
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
