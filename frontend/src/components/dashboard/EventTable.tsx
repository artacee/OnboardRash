// ============================================================
// EventTable — Filterable, animated event history table
// ============================================================

import { motion } from 'framer-motion'
import { Download, Filter, Camera, Video } from 'lucide-react'
import { useEventStore } from '@/stores/useEventStore'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EVENT_TYPE_CONFIG } from '@/lib/constants'
import { formatTime, formatLocation } from '@/lib/utils'
import { getExportUrl } from '@/lib/api'
import type { EventType, Severity } from '@/lib/types'

export function EventTable() {
  const events = useEventStore((s) => s.events)
  const filters = useEventStore((s) => s.filters)
  const setFilters = useEventStore((s) => s.setFilters)

  return (
    <GlassPanel variant="strong" noPadding className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle flex-wrap gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Filter className="w-4 h-4 text-text-ghost flex-shrink-0" />
          <h3 className="font-display font-semibold text-sm whitespace-nowrap">Event History</h3>
          <span className="text-xs font-mono text-text-ghost bg-surface-2 px-2 py-0.5 rounded-full flex-shrink-0">
            {events.length}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Severity Filter */}
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ severity: e.target.value as Severity | '' })}
            className="bg-surface-1 border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-kerala-teal/50 cursor-pointer"
          >
            <option value="">All Severity</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          {/* Type Filter */}
          <select
            value={filters.event_type}
            onChange={(e) => setFilters({ event_type: e.target.value as EventType | '' })}
            className="bg-surface-1 border border-border-subtle rounded-lg px-3 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-kerala-teal/50 cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="HARSH_BRAKE">Harsh Brake</option>
            <option value="HARSH_ACCEL">Harsh Accel</option>
            <option value="AGGRESSIVE_TURN">Aggressive Turn</option>
            <option value="TAILGATING">Tailgating</option>
            <option value="CLOSE_OVERTAKING">Close Overtaking</option>
          </select>

          {/* Export */}
          <a href={getExportUrl({ severity: filters.severity, event_type: filters.event_type })}>
            <Button variant="ghost" size="sm">
              <Download className="w-3.5 h-3.5" />
              CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              {['Time', 'Bus', 'Event', 'Severity', 'Speed', 'Location', 'Evidence'].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-mono uppercase tracking-wider text-text-ghost px-4 py-3 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-text-ghost text-sm py-12">
                  No events found
                </td>
              </tr>
            ) : (
              events.map((event, i) => {
                const config = EVENT_TYPE_CONFIG[event.event_type] || {
                  icon: '⚠️',
                  label: event.event_type,
                }

                return (
                  <motion.tr
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className="border-b border-border-subtle/50 hover:bg-surface-1/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm font-mono text-text-secondary whitespace-nowrap">
                      {formatTime(event.timestamp)}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono font-medium whitespace-nowrap">
                      <span className="truncate max-w-[100px] inline-block align-middle">
                        {event.bus_registration || `Bus ${event.bus_id}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="flex-shrink-0">{config.icon}</span>
                        <span className="truncate max-w-[120px]">{config.label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge severity={event.severity}>{event.severity}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-text-secondary whitespace-nowrap">
                      {event.speed ? `${event.speed.toFixed(0)} km/h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      <span className="truncate max-w-[140px] inline-block align-middle" title={formatLocation(event.location)}>
                        {formatLocation(event.location)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {event.has_snapshot && (
                          <span className="text-kerala-teal" title="Snapshot available">
                            <Camera className="w-4 h-4" />
                          </span>
                        )}
                        {event.has_video && (
                          <span className="text-signal-info" title="Video available">
                            <Video className="w-4 h-4" />
                          </span>
                        )}
                        {!event.has_snapshot && !event.has_video && (
                          <span className="text-text-ghost">—</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  )
}
