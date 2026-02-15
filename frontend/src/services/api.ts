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
  ExportParams
} from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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
      throw new ApiError(
        response.status,
        response.statusText,
        `API request failed: ${response.statusText}`
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
    return apiFetch<DashboardStats>('/api/stats')
  }
}

/**
 * ═══════════════════════════════════════════════════
 * EVENTS API
 * ═══════════════════════════════════════════════════
 */

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
    return apiFetch<Event[]>(endpoint)
  },

  /**
   * Get single event by ID
   * GET /api/events/{id}
   */
  async getEventById(id: number): Promise<Event> {
    return apiFetch<Event>(`/api/events/${id}`)
  }
}

/**
 * ═══════════════════════════════════════════════════
 * BUSES API
 * ═══════════════════════════════════════════════════
 */

export const busesApi = {
  /**
   * Get all buses
   * GET /api/buses
   */
  async getBuses(): Promise<Bus[]> {
    return apiFetch<Bus[]>('/api/buses')
  },

  /**
   * Get all bus locations
   * GET /api/buses/locations
   */
  async getBusLocations(): Promise<BusLocation[]> {
    return apiFetch<BusLocation[]>('/api/buses/locations')
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
      body: JSON.stringify(location)
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
 * COMBINED API EXPORT
 * ═══════════════════════════════════════════════════
 */

const api = {
  stats: statsApi,
  events: eventsApi,
  buses: busesApi,
  export: exportApi
}

export default api
