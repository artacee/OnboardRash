/**
 * OnboardRash Frontend TypeScript Interfaces
 * Centralized type definitions for the entire application
 */

/**
 * ═══════════════════════════════════════════════════
 * DASHBOARD TYPES
 * ═══════════════════════════════════════════════════
 */

export interface DashboardStats {
  total_events_today: number
  active_buses: number
  total_buses: number
  high_severity_count: number
  event_breakdown: Record<string, number>
}

/**
 * ═══════════════════════════════════════════════════
 * EVENT TYPES
 * ═══════════════════════════════════════════════════
 */

export type EventType = 'HARSH_BRAKE' | 'HARSH_ACCEL' | 'AGGRESSIVE_TURN' | 'TAILGATING' | 'CLOSE_OVERTAKING'
export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Event {
  id: number
  bus_id: number
  bus_registration?: string
  event_type: EventType
  severity: EventSeverity
  timestamp: string
  latitude: number
  longitude: number
  speed: number
  accel_x: number
  accel_y: number
  accel_z: number
  snapshot_path?: string
  video_path?: string
  acknowledged?: boolean
}

export interface GetEventsParams {
  limit?: number
  offset?: number
  severity?: EventSeverity
  event_type?: EventType
  start_date?: string
  end_date?: string
  sort?: 'asc' | 'desc'
}

/**
 * ═══════════════════════════════════════════════════
 * BUS TYPES
 * ═══════════════════════════════════════════════════
 */

export type BusStatus = 'active' | 'idle' | 'offline'

export interface Bus {
  id: number
  registration_number: string
  driver_name: string
  route: string
  is_active: boolean
  created_at: string
  last_latitude?: number
  last_longitude?: number
  last_update?: string
}

export interface BusLocation {
  bus_id: number
  registration_number: string
  driver_name: string
  latitude: number
  longitude: number
  speed: number
  heading: number
  timestamp: string
  status: BusStatus
}

/**
 * ═══════════════════════════════════════════════════
 * EXPORT TYPES
 * ═══════════════════════════════════════════════════
 */

export interface ExportParams {
  start_date?: string
  end_date?: string
}

/**
 * ═══════════════════════════════════════════════════
 * WEBSOCKET TYPES
 * ═══════════════════════════════════════════════════
 */

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'disconnected'

export interface SocketIOHook {
  isConnected: boolean
  connectionQuality: ConnectionQuality
  subscribe: (event: string, callback: (...args: any[]) => void) => () => void // eslint-disable-line @typescript-eslint/no-explicit-any
  unsubscribe: (event: string) => void
  emit: (event: string, data: any) => void // eslint-disable-line @typescript-eslint/no-explicit-any
}

/**
 * ═══════════════════════════════════════════════════
 * API TYPES
 * ═══════════════════════════════════════════════════
 */

export interface ApiErrorType {
  status: number
  statusText: string
  message: string
}

/**
 * ═══════════════════════════════════════════════════
 * SYSTEM TYPES
 * ═══════════════════════════════════════════════════
 */

export interface SystemHealth {
  status: 'online' | 'offline' | 'maintenance'
  uptime: string
  version: string
  last_check: string
}

/**
 * ═══════════════════════════════════════════════════
 * COMPONENT PROP TYPES
 * ═══════════════════════════════════════════════════
 */

export interface MetricCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: 'info' | 'warning' | 'danger' | 'safe'
  subtitle?: string
  delay?: number
  pulse?: boolean
}

export interface GlassCardProps {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'interactive' | 'subtle'
  animate?: boolean
  className?: string
}

export interface FloatingButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  className?: string
  disabled?: boolean
}

export interface GlassInputProps {
  label?: string
  error?: string
  helperText?: string
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  className?: string
  disabled?: boolean
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  showCloseButton?: boolean
  closeOnOutsideClick?: boolean
  closeOnEscape?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

/**
 * ═══════════════════════════════════════════════════
 * LAYOUT TYPES
 * ═══════════════════════════════════════════════════
 */

export interface LayoutProps {
  children: React.ReactNode
  includeAtmosphere?: boolean
}

export interface NavbarProps {
  className?: string
}

export interface SidebarProps {
  className?: string
  defaultCollapsed?: boolean
}

export interface FooterProps {
  className?: string
}

/**
 * ═══════════════════════════════════════════════════
 * UTILITY TYPES
 * ═══════════════════════════════════════════════════
 */

export type ThemeColor = 'info' | 'warning' | 'danger' | 'safe'
export type ComponentSize = 'sm' | 'md' | 'lg'
export type ComponentVariant = 'primary' | 'secondary' | 'tertiary'