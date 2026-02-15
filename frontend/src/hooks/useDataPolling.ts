// ============================================================
// OnboardRash — Data Polling Hook
// Fetches stats, events, locations on interval via TanStack Query
// ============================================================

import { useQuery } from '@tanstack/react-query'
import { fetchStats, fetchEvents, fetchBusLocations } from '@/lib/api'
import { useEventStore } from '@/stores/useEventStore'
import { useBusStore } from '@/stores/useBusStore'
import { STATS_REFRESH_MS, LOCATIONS_REFRESH_MS } from '@/lib/constants'
import { useEffect } from 'react'

export function useDataPolling() {
  const setStats = useEventStore((s) => s.setStats)
  const setEvents = useEventStore((s) => s.setEvents)
  const filters = useEventStore((s) => s.filters)
  const setLocations = useBusStore((s) => s.setLocations)

  // Stats — refresh every 30s
  const statsQuery = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
    refetchInterval: STATS_REFRESH_MS,
  })

  // Events — refresh on filter change
  const eventsQuery = useQuery({
    queryKey: ['events', filters],
    queryFn: () =>
      fetchEvents({
        severity: filters.severity || undefined,
        event_type: filters.event_type || undefined,
        limit: 50,
      }),
  })

  // Bus Locations — refresh every 10s
  const locationsQuery = useQuery({
    queryKey: ['locations'],
    queryFn: fetchBusLocations,
    refetchInterval: LOCATIONS_REFRESH_MS,
  })

  // Sync query results into Zustand stores
  useEffect(() => {
    if (statsQuery.data) setStats(statsQuery.data)
  }, [statsQuery.data, setStats])

  useEffect(() => {
    if (eventsQuery.data) setEvents(eventsQuery.data.events)
  }, [eventsQuery.data, setEvents])

  useEffect(() => {
    if (locationsQuery.data) setLocations(locationsQuery.data.locations)
  }, [locationsQuery.data, setLocations])

  return { statsQuery, eventsQuery, locationsQuery }
}
