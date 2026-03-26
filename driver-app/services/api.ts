/**
 * API service for communicating with the Flask backend.
 * 
 * Features:
 * - JWT Bearer token authentication (stored in SecureStore)
 * - Request timeout via AbortController (15s)
 * - 401 interceptor → clears auth and triggers redirect
 * - Safe JSON parsing (handles non-JSON error responses)
 * - Typed return values
 */

import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import type {
    AuthResponse,
    ProfileResponse,
    EventsResponse,
    TripsResponse,
    BusesResponse,
    TripActionResponse,
} from '@/types';

// ─── Configuration ─────────────────────────────────────

/**
 * Resolve the backend URL using multiple strategies (first match wins):
 *
 *  1. EXPO_PUBLIC_API_URL env var / extra.apiUrl baked at build time
 *     → works in production/EAS builds, `expo export`, OTA updates
 *
 *  2. Expo dev-server hostUri (Constants.expoConfig.hostUri)
 *     → works in `npx expo start` / Expo Go during development
 *
 *  3. Fallback to localhost (only useful in emulator / web)
 *
 * Why the old code didn't work after bundling:
 *   `hostUri` and `debuggerHost` are injected by the Expo dev-server
 *   at runtime. Once you bundle (export/EAS), there is no dev-server,
 *   so both are undefined and the code always fell through to localhost.
 */
function getDefaultApiUrl(): string {
    // 1️⃣  Build-time value baked via app.config.ts / EXPO_PUBLIC_API_URL
    const buildTimeUrl =
        Constants.expoConfig?.extra?.apiUrl ??
        process.env.EXPO_PUBLIC_API_URL;
    if (buildTimeUrl) return buildTimeUrl;

    // 2️⃣  Dev-server auto-detect (only works during `npx expo start`)
    try {
        const debuggerHost =
            Constants.expoConfig?.hostUri ??
            (Constants as any).manifest?.debuggerHost;
        if (debuggerHost) {
            const ip = debuggerHost.split(':')[0];
            if (ip) return `http://${ip}:5000`;
        }
    } catch (_) {
        // fall through to fallback
    }

    // 3️⃣  Last resort
    return 'http://localhost:5000';
}

const DEFAULT_API_URL = getDefaultApiUrl();
const REQUEST_TIMEOUT_MS = 15_000;

let apiUrl = DEFAULT_API_URL;

export function setApiUrl(url: string) {
    apiUrl = url;
}

export function getApiUrl() {
    return apiUrl;
}

/** Load persisted API URL from SecureStore on startup. */
export async function initApiUrl() {
    const stored = await SecureStore.getItemAsync('api_url');
    if (stored) apiUrl = stored;
    else apiUrl = DEFAULT_API_URL; // re-derive in case network changed
}

/** Persist the API URL to SecureStore. */
export async function persistApiUrl(url: string) {
    apiUrl = url;
    await SecureStore.setItemAsync('api_url', url);
}

// ─── Auth Token ────────────────────────────────────────

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
    if (cachedToken) return cachedToken;
    cachedToken = await SecureStore.getItemAsync('auth_token');
    return cachedToken;
}

async function setToken(token: string | null) {
    cachedToken = token;
    if (token) {
        await SecureStore.setItemAsync('auth_token', token);
    } else {
        await SecureStore.deleteItemAsync('auth_token');
    }
}

// ─── Driver ID (kept for backward compat) ──────────────

let currentDriverId: string | null = null;

export async function getDriverId(): Promise<string | null> {
    if (currentDriverId) return currentDriverId;
    currentDriverId = await SecureStore.getItemAsync('driver_id');
    return currentDriverId;
}

export async function setDriverId(id: string | null) {
    currentDriverId = id;
    if (id) {
        await SecureStore.setItemAsync('driver_id', id);
    } else {
        await SecureStore.deleteItemAsync('driver_id');
    }
}

// ─── HTTP Helpers ──────────────────────────────────────

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

async function apiFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Request timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(`${apiUrl}${path}`, {
            ...options,
            headers,
            signal: controller.signal,
        });

        // Try to parse JSON safely
        let data: any;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { error: text || `Request failed: ${response.status}` };
        }

        if (!response.ok) {
            // 401 → clear auth and redirect to login
            if (response.status === 401) {
                await clearAuth();
                try { router.replace('/login'); } catch { /* may not be mounted yet */ }
            }
            throw new ApiError(
                data.error || `Request failed: ${response.status}`,
                response.status
            );
        }

        return data as T;
    } catch (err: any) {
        if (err.name === 'AbortError') {
            throw new ApiError('Request timed out. Check your connection.', 0);
        }
        if (err instanceof ApiError) throw err;
        // Network error (no response at all)
        throw new ApiError('Cannot reach server. Check your network.', 0);
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Auth ──────────────────────────────────────────────

export async function register(payload: {
    username: string;
    password: string;
    full_name: string;
    phone_number?: string;
    license_number?: string;
}): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>('/api/drivers/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    await setToken(data.token);
    await setDriverId(String(data.driver.id));
    return data;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
    const data = await apiFetch<AuthResponse>('/api/drivers/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
    await setToken(data.token);
    await setDriverId(String(data.driver.id));
    return data;
}

export async function logout() {
    await clearAuth();
}

async function clearAuth() {
    cachedToken = null;
    currentDriverId = null;
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('driver_id');
}

/** Check if user has a stored auth token. */
export async function hasAuth(): Promise<boolean> {
    const token = await getToken();
    return !!token;
}

// ─── Profile ───────────────────────────────────────────

export async function getProfile(): Promise<ProfileResponse> {
    return apiFetch<ProfileResponse>('/api/drivers/me');
}

// ─── Events ────────────────────────────────────────────

export async function getMyEvents(): Promise<EventsResponse> {
    return apiFetch<EventsResponse>('/api/drivers/me/events');
}

// ─── Trips ─────────────────────────────────────────────

export async function startTrip(busId?: number, busRegistration?: string): Promise<TripActionResponse> {
    return apiFetch<TripActionResponse>('/api/drivers/me/trip/start', {
        method: 'POST',
        body: JSON.stringify({
            bus_id: busId,
            bus_registration: busRegistration,
        }),
    });
}

export async function stopTrip(): Promise<TripActionResponse> {
    return apiFetch<TripActionResponse>('/api/drivers/me/trip/stop', {
        method: 'POST',
    });
}

export async function getTrips(): Promise<TripsResponse> {
    return apiFetch<TripsResponse>('/api/drivers/me/trips');
}

// ─── Buses ─────────────────────────────────────────────

export async function getBuses(): Promise<BusesResponse> {
    return apiFetch<BusesResponse>('/api/drivers/buses');
}

// ─── Trip Detail ───────────────────────────────────────

export interface TripDetailResponse {
    trip: import('@/types').Trip;
    events: import('@/types').DrivingEvent[];
}

export async function getTripDetail(tripId: number): Promise<TripDetailResponse> {
    return apiFetch<TripDetailResponse>(`/api/drivers/me/trips/${tripId}`);
}

// ─── Admin Bypass (Direct-to-Backend IoT endpoints) ────

/**
 * Inject a driving event directly to the backend, bypassing the Raspberry Pi.
 * Uses the unauthenticated IoT endpoint POST /api/events.
 */
export async function injectEvent(payload: {
    bus_id: number;
    event_type: string;
    severity: string;
    acceleration_x: number;
    acceleration_y: number;
    acceleration_z: number;
    speed: number;
    location: { lat: number; lng: number };
}): Promise<any> {
    const res = await fetch(`${apiUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, timestamp: new Date().toISOString() }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Update a bus's GPS location directly on the backend, bypassing the Pi.
 * Uses the unauthenticated IoT endpoint POST /api/buses/:id/location.
 */
export async function updateBusLocation(
    busId: number,
    lat: number,
    lng: number,
    speed: number | null,
    heading: number | null,
): Promise<any> {
    const res = await fetch(`${apiUrl}/api/buses/${busId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, speed, heading }),
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Reset (delete) all driving events in the backend database.
 * Uses DELETE /api/events/reset.
 */
export async function resetEvents(): Promise<{ message: string; deleted: number }> {
    const res = await fetch(`${apiUrl}/api/events/reset`, { method: 'DELETE' });
    if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || `HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Check if the backend server is reachable.
 * Hits GET /api/stats as a lightweight health probe.
 */
export async function checkBackendHealth(): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
        const res = await fetch(`${apiUrl}/api/stats`, {
            method: 'GET',
            signal: controller.signal,
        });
        return res.ok;
    } catch {
        return false;
    } finally {
        clearTimeout(timeout);
    }
}

// ─── Pi Connect Mode (Direct-to-Pi Local API) ─────────

/** Pending event from the Pi's demo buffer. */
export interface PiPendingEvent {
    id: number;
    type: string;
    severity: string;
    value: number;
    timestamp?: string;
    buffered_at?: string;
    lat?: number | null;
    lng?: number | null;
    speed?: number | null;
}

/** Pi status response. */
export interface PiStatusResponse {
    online: boolean;
    demo_hold_mode: boolean;
    pending_count: number;
    sensors: Record<string, string>;
}

/** Helper for Pi HTTP calls (no auth, short timeout). */
async function piFetch<T = any>(piUrl: string, path: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(`${piUrl}${path}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) },
            signal: controller.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Pi HTTP ${res.status}`);
        return data as T;
    } catch (err: any) {
        if (err.name === 'AbortError') throw new Error('Pi connection timed out');
        throw err;
    } finally {
        clearTimeout(timeout);
    }
}

/** Check if the Pi's demo server is reachable. */
export async function piCheckHealth(piUrl: string): Promise<PiStatusResponse | null> {
    try {
        return await piFetch<PiStatusResponse>(piUrl, '/status');
    } catch {
        return null;
    }
}

/** Get pending (buffered) events from the Pi. */
export async function piGetPendingEvents(piUrl: string): Promise<PiPendingEvent[]> {
    const data = await piFetch<{ events: PiPendingEvent[] }>(piUrl, '/pending-events');
    return data.events || [];
}

/** Confirm and send a specific buffered event (triggers evidence capture on Pi). */
export async function piConfirmEvent(piUrl: string, eventId: number, lat?: number, lng?: number, speed?: number | null): Promise<any> {
    return piFetch(piUrl, '/confirm-event', {
        method: 'POST',
        body: JSON.stringify({ event_id: eventId, lat, lng, speed }),
    });
}

/** Inject a manual event on the Pi (captures real evidence and sends to backend). */
export async function piInjectEvent(piUrl: string, eventType: string, severity: string, lat?: number, lng?: number, speed?: number | null): Promise<any> {
    return piFetch(piUrl, '/inject-event', {
        method: 'POST',
        body: JSON.stringify({ event_type: eventType, severity, lat, lng, speed }),
    });
}

/** Toggle demo-hold mode on the Pi. */
export async function piSetMode(piUrl: string, demoHold: boolean): Promise<any> {
    return piFetch(piUrl, '/set-mode', {
        method: 'POST',
        body: JSON.stringify({ demo_hold: demoHold }),
    });
}

/** Clear all pending events on the Pi. */
export async function piClearEvents(piUrl: string): Promise<any> {
    return piFetch(piUrl, '/clear-events', { method: 'DELETE' });
}

/** Persist the Pi URL to SecureStore. */
export async function persistPiUrl(url: string) {
    await SecureStore.setItemAsync('pi_url', url);
}

/** Load the Pi URL from SecureStore. */
export async function loadPiUrl(): Promise<string | null> {
    return SecureStore.getItemAsync('pi_url');
}

// ─── Pi Auto-Discovery (via Backend) ───────────────────

/** Info returned by the backend's Pi discovery endpoint. */
export interface PiDiscoveryInfo {
    pi_ip: string;
    gps_port: number;
    demo_port: number;
    bus_registration: string;
    last_seen: string;
}

/**
 * Ask the backend if any Pi has registered a heartbeat for the given bus.
 * Falls back to returning the sole registered Pi if only one exists.
 * Returns null if no Pi is found.
 */
export async function discoverPi(busRegistration?: string): Promise<PiDiscoveryInfo | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const query = busRegistration ? `?bus=${encodeURIComponent(busRegistration)}` : '';
        const res = await fetch(`${apiUrl}/api/pi/discover${query}`, {
            method: 'GET',
            signal: controller.signal,
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}
