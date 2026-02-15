// ============================================================
// AlertFeed — Real-time scrolling alert panel
// ============================================================

import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Check, Clock } from 'lucide-react'
import { useEventStore } from '@/stores/useEventStore'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { EVENT_TYPE_CONFIG } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { DrivingEvent } from '@/lib/types'

export function AlertFeed() {
  const alerts = useEventStore((s) => s.alerts)

  return (
    <GlassPanel variant="strong" noPadding className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-ksrtc-crimson animate-dot-pulse" />
          <h3 className="font-display font-semibold text-sm">Live Alerts</h3>
        </div>
        <span className="text-xs font-mono text-text-ghost bg-surface-2 px-2 py-1 rounded-full">
          {alerts.length}
        </span>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        <AnimatePresence initial={false}>
          {alerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-text-ghost text-sm py-12"
            >
              <Clock className="w-8 h-8 mb-3 opacity-40" />
              <p>Waiting for events...</p>
              <p className="text-xs mt-1">Alerts appear here in real-time</p>
            </motion.div>
          ) : (
            alerts.map((alert) => (
              <AlertCard key={`${alert.id}-${alert.timestamp}`} alert={alert} />
            ))
          )}
        </AnimatePresence>
      </div>
    </GlassPanel>
  )
}

function AlertCard({ alert }: { alert: DrivingEvent }) {
  const config = EVENT_TYPE_CONFIG[alert.event_type] || {
    icon: '⚠️',
    label: alert.event_type,
    shortLabel: alert.event_type,
  }

  const severityBorder = {
    HIGH: 'border-l-signal-critical',
    MEDIUM: 'border-l-signal-warning',
    LOW: 'border-l-signal-safe',
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -30, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'p-3 rounded-lg bg-surface-1/60 border border-border-subtle border-l-[3px]',
        severityBorder[alert.severity],
        alert.severity === 'HIGH' && 'bg-signal-critical/[0.04]'
      )}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">{config.icon}</span>
          <span className="text-sm font-semibold">{config.label}</span>
        </div>
        <Badge severity={alert.severity} pulse={alert.severity === 'HIGH'}>
          {alert.severity}
        </Badge>
      </div>

      {/* Details */}
      <div className="flex items-center gap-3 text-xs text-text-secondary">
        <span className="font-mono">{alert.bus_registration || `Bus ${alert.bus_id}`}</span>
        {alert.speed && (
          <>
            <span className="text-text-ghost">•</span>
            <span className="font-mono">{alert.speed.toFixed(0)} km/h</span>
          </>
        )}
        <span className="text-text-ghost">•</span>
        <span>{formatRelativeTime(alert.timestamp)}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2.5">
        {alert.has_snapshot && (
          <button className="flex items-center gap-1 text-[10px] font-mono text-text-ghost hover:text-kerala-teal transition-colors cursor-pointer">
            <Camera className="w-3 h-3" />
            Evidence
          </button>
        )}
        <button className="flex items-center gap-1 text-[10px] font-mono text-text-ghost hover:text-signal-safe transition-colors cursor-pointer ml-auto">
          <Check className="w-3 h-3" />
          Acknowledge
        </button>
      </div>
    </motion.div>
  )
}
