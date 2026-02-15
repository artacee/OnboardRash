// ============================================================
// Badge — Severity & status badges
// ============================================================

import { cn } from '@/lib/utils'
import type { Severity } from '@/lib/types'

interface BadgeProps {
  severity: Severity
  children: React.ReactNode
  className?: string
  pulse?: boolean
}

const severityStyles: Record<Severity, string> = {
  HIGH: 'bg-signal-critical/15 text-signal-critical border-signal-critical/30',
  MEDIUM: 'bg-signal-warning/15 text-signal-warning border-signal-warning/30',
  LOW: 'bg-signal-safe/15 text-signal-safe border-signal-safe/30',
}

export function Badge({ severity, children, className, pulse }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
        'font-mono uppercase tracking-wide whitespace-nowrap',
        severityStyles[severity],
        pulse && severity === 'HIGH' && 'animate-pulse-critical',
        className
      )}
    >
      {pulse && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full flex-shrink-0',
            severity === 'HIGH' && 'bg-signal-critical animate-dot-pulse',
            severity === 'MEDIUM' && 'bg-signal-warning',
            severity === 'LOW' && 'bg-signal-safe'
          )}
        />
      )}
      {children}
    </span>
  )
}
