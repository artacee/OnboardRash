/**
 * API service for communicating with the Flask backend.
 */

import * as SecureStore from 'expo-secure-store';

// Default to localhost for dev; change for production
const DEFAULT_API_URL = 'http://192.168.1.40:5000';

let apiUrl = DEFAULT_API_URL;

export function setApiUrl(url: string) {
    apiUrl = url;
}

export function getApiUrl() {
    return apiUrl;
}

// ─── Driver Session ────────────────────────────────────

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

async function apiFetch(path: string, options: RequestInit = {}) {
    const driverId = await getDriverId();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (driverId) {
        headers['X-Driver-Id'] = driverId;
    }

    const response = await fetch(`${apiUrl}${path}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `Request failed: ${response.status}`);
    }

    return data;
}

// ─── Auth ──────────────────────────────────────────────

export async function register(payload: {
    username: string;
    password: string;
    full_name: string;
    phone_number?: string;
    license_number?: string;
}) {
    const data = await apiFetch('/api/drivers/register', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    await setDriverId(String(data.driver.id));
    return data;
}

export async function login(username: string, password: string) {
    const data = await apiFetch('/api/drivers/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
    await setDriverId(String(data.driver.id));
    return data;
}

export async function logout() {
    await setDriverId(null);
}

// ─── Profile ───────────────────────────────────────────

export async function getProfile() {
    return apiFetch('/api/drivers/me');
}

// ─── Events ────────────────────────────────────────────

export async function getMyEvents() {
    return apiFetch('/api/drivers/me/events');
}

// ─── Trips ─────────────────────────────────────────────

export async function startTrip(busId?: number, busRegistration?: string) {
    return apiFetch('/api/drivers/me/trip/start', {
        method: 'POST',
        body: JSON.stringify({
            bus_id: busId,
            bus_registration: busRegistration,
        }),
    });
}

export async function stopTrip() {
    return apiFetch('/api/drivers/me/trip/stop', {
        method: 'POST',
    });
}

export async function getTrips() {
    return apiFetch('/api/drivers/me/trips');
}

// ─── Buses ─────────────────────────────────────────────

export async function getBuses() {
    return apiFetch('/api/drivers/buses');
}
