/**
 * TypeScript interfaces for the OnboardRash Driver App.
 * Mirrors the backend model dictionaries.
 */

export interface Driver {
  id: number;
  username: string;
  full_name: string;
  phone_number: string | null;
  license_number: string | null;
  created_at: string;
}

export interface Bus {
  id: number;
  registration_number: string;
  driver_name: string | null;
  route: string | null;
  is_active: boolean;
}

export interface Trip {
  id: number;
  driver_id: number;
  driver_name: string | null;
  bus_id: number;
  bus_registration: string | null;
  started_at: string;
  ended_at: string | null;
  score: number;
  event_count: number;
  is_active: boolean;
}

export interface DrivingEvent {
  id: number;
  bus_id: number;
  bus_registration: string | null;
  event_type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  acceleration_x: number | null;
  acceleration_y: number | null;
  acceleration_z: number | null;
  speed: number | null;
  location: {
    lat: number | null;
    lng: number | null;
    address: string | null;
  };
  timestamp: string;
  alert_sent: boolean;
  acknowledged: boolean;
  has_video: boolean;
  has_snapshot: boolean;
  snapshot_url: string | null;
  video_url: string | null;
}

export interface TripStats {
  total_trips: number;
  avg_score: number;
}

export interface ProfileResponse {
  driver: Driver;
  active_trip: Trip | null;
  stats: TripStats;
}

export interface EventsResponse {
  events: DrivingEvent[];
  count: number;
}

export interface TripsResponse {
  trips: Trip[];
  count: number;
}

export interface BusesResponse {
  buses: Bus[];
}

export interface AuthResponse {
  status: string;
  driver: Driver;
  token: string;
}

export interface TripActionResponse {
  status: string;
  trip: Trip;
}
