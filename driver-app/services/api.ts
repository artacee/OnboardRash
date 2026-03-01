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

const DEFAULT_API_URL = 'http://192.168.1.35:5000';
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
