/**
 * API Service Layer
 * Centralized API client for OnboardRash backend
 */

import type {
  DashboardStats,
  Event,
  GetEventsParams,
  Bus,
  BusLocation,
  BusStatus,
  ExportParams
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

/**
 * Generic API error class
 */
export class ApiError extends Error {
  status: number
  statusText: string

  constructor(status: number, statusText: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      ...options
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null)
      throw new ApiError(
        response.status,
        response.statusText,
        errorBody?.error || `API request failed: ${response.statusText}`
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * ═══════════════════════════════════════════════════
 * STATS API
 * ═══════════════════════════════════════════════════
 */

export const statsApi = {
  /**
   * Get dashboard statistics
   * GET /api/stats
   */
  async getStats(): Promise<DashboardStats> {
    const data = await apiFetch<any>('/api/stats') // eslint-disable-line @typescript-eslint/no-explicit-any
    return {
      total_events_today: data.today_events ?? 0,
      active_buses: data.active_buses ?? 0,
      total_buses: data.total_buses ?? 0,
      high_severity_count: data.high_severity ?? 0,
      event_breakdown: data.events_by_type ?? {}
    }
  }
}

/**
 * ═══════════════════════════════════════════════════
 * EVENTS API
 * ═══════════════════════════════════════════════════
 */

/**
 * Map a raw backend event object to the frontend Event type
 */
export function mapEvent(e: any): Event { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    id: e.id,
    bus_id: e.bus_id,
    bus_registration: e.bus_registration,
    event_type: e.event_type,
    severity: e.severity,
    timestamp: e.timestamp,
    latitude: e.location?.lat ?? 0,
    longitude: e.location?.lng ?? 0,
    speed: e.speed ?? 0,
    accel_x: e.acceleration_x ?? 0,
    accel_y: e.acceleration_y ?? 0,
    accel_z: e.acceleration_z ?? 0,
    snapshot_path: e.snapshot_url,
    video_path: e.video_url,
    acknowledged: e.acknowledged
  }
}

export const eventsApi = {
  /**
   * Get all events with optional filters
   * GET /api/events
   */
  async getEvents(params?: GetEventsParams): Promise<Event[]> {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
    }

    const endpoint = `/api/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const data = await apiFetch<any>(endpoint) // eslint-disable-line @typescript-eslint/no-explicit-any
    return (data.events || []).map(mapEvent)
  },

  /**
   * Get single event by ID
   * GET /api/events/{id}
   */
  async getEventById(id: number): Promise<Event> {
    const data = await apiFetch<any>(`/api/events/${id}`) // eslint-disable-line @typescript-eslint/no-explicit-any
    return mapEvent(data)
  }
}

/**
 * ═══════════════════════════════════════════════════
 * BUSES API
 * ═══════════════════════════════════════════════════
 */

/**
 * Map a raw backend bus location to the frontend BusLocation type
 */
function mapBusLocation(loc: any): BusLocation { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    bus_id: loc.bus_id,
    registration_number: loc.bus_registration || '',
    driver_name: '',
    latitude: loc.latitude,
    longitude: loc.longitude,
    speed: loc.speed ?? 0,
    heading: loc.heading ?? 0,
    timestamp: loc.updated_at || '',
    status: 'active' as BusStatus
  }
}

export const busesApi = {
  /**
   * Get all buses
   * GET /api/buses
   */
  async getBuses(): Promise<Bus[]> {
    const data = await apiFetch<any>('/api/buses') // eslint-disable-line @typescript-eslint/no-explicit-any
    return data.buses || []
  },

  /**
   * Get all bus locations
   * GET /api/buses/locations
   */
  async getBusLocations(): Promise<BusLocation[]> {
    const data = await apiFetch<any>('/api/buses/locations') // eslint-disable-line @typescript-eslint/no-explicit-any
    return (data.locations || []).map(mapBusLocation)
  },

  /**
   * Update bus location
   * POST /api/buses/{id}/location
   */
  async updateBusLocation(
    busId: number,
    location: { latitude: number; longitude: number }
  ): Promise<{ status: string }> {
    return apiFetch<{ status: string }>(`/api/buses/${busId}/location`, {
      method: 'POST',
      body: JSON.stringify({ lat: location.latitude, lng: location.longitude })
    })
  }
}

/**
 * ═══════════════════════════════════════════════════
 * EXPORT API
 * ═══════════════════════════════════════════════════
 */

export const exportApi = {
  /**
   * Generate CSV export URL
   * GET /api/export/events
   */
  getExportUrl(params?: ExportParams): string {
    const queryParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value))
        }
      })
    }

    return `${API_BASE_URL}/api/export/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  },

  /**
   * Download events as CSV
   * Opens download in new tab
   */
  downloadEvents(params?: ExportParams): void {
    window.open(this.getExportUrl(params), '_blank')
  }
}

/**
 * ═══════════════════════════════════════════════════
 * AUTH API
 * ═══════════════════════════════════════════════════
 */

export const authApi = {
  /**
   * Login with username and password
   * POST /api/auth/login
   */
  async login(username: string, password: string): Promise<{ status: string; user: { username: string; role: string } }> {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
  }
}

/**
 * ══════════════════════════════════════════════════
 * SIMULATION API
 * ══════════════════════════════════════════════════
 */
export const simulationApi = {
  /**
   * Get simulation status
   * GET /api/simulation/status
   */
  async getStatus(): Promise<{ running: boolean; pid: number | null }> {
    return apiFetch('/api/simulation/status')
  },

  /**
   * Start simulation
   * POST /api/simulation/start
   */
  async start(): Promise<{ status: string; pid: number }> {
    return apiFetch('/api/simulation/start', { method: 'POST' })
  },

  /**
   * Stop simulation
   * POST /api/simulation/stop
   */
  async stop(): Promise<{ status: string }> {
    return apiFetch('/api/simulation/stop', { method: 'POST' })
  }
}

/**
 * ═══════════════════════════════════════════════════
 * COMBINED API EXPORT
 * ═══════════════════════════════════════════════════
 */

const api = {
  stats: statsApi,
  events: eventsApi,
  buses: busesApi,
  export: exportApi,
  auth: authApi,
  simulation: simulationApi
}

export default api
