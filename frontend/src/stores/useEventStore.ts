// ============================================================
// OnboardRash — Event Store (Zustand)
// Manages real-time events, alerts, and stats from WebSocket + API
// ============================================================

import { create } from 'zustand'
import type { DrivingEvent, Stats, EventFilters, ThreatLevel } from '@/lib/types'

interface EventState {
  // Data
  events: DrivingEvent[]
  alerts: DrivingEvent[]
  stats: Stats

  // Filters
  filters: EventFilters

  // Computed
  threatLevel: ThreatLevel

  // Actions
  setEvents: (events: DrivingEvent[]) => void
  addAlert: (event: DrivingEvent) => void
  setStats: (stats: Stats) => void
  setFilters: (filters: Partial<EventFilters>) => void
  clearAlerts: () => void
}

function computeThreatLevel(stats: Stats): ThreatLevel {
  if (stats.high_severity >= 3) return 'critical'
  if (stats.today_events >= 10 || stats.high_severity >= 1) return 'elevated'
  return 'safe'
}

export const useEventStore = create<EventState>((set) => ({
  events: [],
  alerts: [],
  stats: { total_buses: 0, active_buses: 0, today_events: 0, high_severity: 0 },
  filters: { severity: '', event_type: '' },
  threatLevel: 'safe',

  setEvents: (events) => set({ events }),

  addAlert: (event) =>
    set((state) => {
      const alerts = [event, ...state.alerts].slice(0, 30)
      const events = [event, ...state.events]
      const stats = {
        ...state.stats,
        today_events: state.stats.today_events + 1,
        high_severity:
          state.stats.high_severity + (event.severity === 'HIGH' ? 1 : 0),
      }
      return {
        alerts,
        events,
        stats,
        threatLevel: computeThreatLevel(stats),
      }
    }),

  setStats: (stats) =>
    set({ stats, threatLevel: computeThreatLevel(stats) }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  clearAlerts: () => set({ alerts: [] }),
}))
