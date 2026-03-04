/**
 * GPS Streaming Service
 * 
 * Uses expo-location to capture GPS data and POST it to the Raspberry Pi's
 * local PhoneGPSReceiver endpoint at 2Hz via the phone's WiFi hotspot.
 * 
 * Runs as a foreground service so GPS continues when screen is off.
 */

import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';

// TaskManager / background location is only available in a development build,
// not in Expo Go (removed from Expo Go in SDK 52).
// We import lazily and guard every call so the app doesn't crash in Expo Go.
let TaskManager: typeof import('expo-task-manager') | null = null;
try {
    TaskManager = require('expo-task-manager');
} catch {
    // Running inside Expo Go — background tasks unavailable
}

const GPS_TASK_NAME = 'ONBOARDRASH_GPS_STREAM';

// Default Pi address: Pi is assigned static IP 192.168.43.100 on the phone hotspot
// (Note: 192.168.43.1 is the phone's own gateway address — NOT the Pi)
let piUrl = 'http://192.168.43.100:8081';

// Failure tracking
let consecutiveFailures = 0;
const MAX_FAILURES_BEFORE_WARNING = 10;
let onStreamError: ((failures: number) => void) | null = null;

export function setPiUrl(url: string) {
    piUrl = url;
}

export function getPiUrl() {
    return piUrl;
}

/** Load persisted Pi URL from SecureStore on startup. */
export async function initPiUrl() {
    const stored = await SecureStore.getItemAsync('pi_url');
    if (stored) piUrl = stored;
}

/** Persist the Pi URL to SecureStore. */
export async function persistPiUrl(url: string) {
    piUrl = url;
    await SecureStore.setItemAsync('pi_url', url);
}

/** Register a callback for when GPS streaming encounters repeated failures. */
export function setStreamErrorCallback(cb: ((failures: number) => void) | null) {
    onStreamError = cb;
}

// ─── Background Task Definition ────────────────────────
// Only register the background task when TaskManager is available (dev build).

if (TaskManager) TaskManager.defineTask(GPS_TASK_NAME, async ({ data, error }: any) => {
    if (error) {
        console.error('[GPS Stream] Error:', error);
        return;
    }

    if (data) {
        const { locations } = data as { locations: Location.LocationObject[] };
        const loc = locations[0];

        if (!loc) return;

        // Filter out low-accuracy readings (> 50m)
        if (loc.coords.accuracy !== null && loc.coords.accuracy > 50) {
            return;
        }

        const payload = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: loc.coords.speed !== null ? loc.coords.speed * 3.6 : null, // m/s → km/h
            heading: loc.coords.heading,
            accuracy: loc.coords.accuracy,
            altitude: loc.coords.altitude,
            timestamp: loc.timestamp,
        };

        try {
            await fetch(`${piUrl}/gps`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            consecutiveFailures = 0; // Reset on success
        } catch {
            consecutiveFailures++;
            if (consecutiveFailures === MAX_FAILURES_BEFORE_WARNING && onStreamError) {
                onStreamError(consecutiveFailures);
            }
        }
    }
});

// ─── Public API ────────────────────────────────────────

export async function requestPermissions(): Promise<boolean> {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') return false;

    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    return bg === 'granted';
}

export async function startGPSStream(): Promise<boolean> {
    if (!TaskManager) {
        // Expo Go — background GPS not available, return true to not block trip start
        console.warn('[GPS] Background tasks unavailable in Expo Go. Use a dev build for GPS streaming.');
        return true;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return false;

    // Check if already running
    const isRunning = await Location.hasStartedLocationUpdatesAsync(GPS_TASK_NAME);
    if (isRunning) return true;

    consecutiveFailures = 0;

    await Location.startLocationUpdatesAsync(GPS_TASK_NAME, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 500,          // 2Hz
        distanceInterval: 0,        // Update even when stationary
        deferredUpdatesInterval: 0,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
            notificationTitle: 'OnboardRash Active',
            notificationBody: 'Streaming GPS to detection unit',
            notificationColor: '#34d399',
        },
    });

    return true;
}

export async function stopGPSStream(): Promise<void> {
    if (!TaskManager) return;
    const isRunning = await Location.hasStartedLocationUpdatesAsync(GPS_TASK_NAME);
    if (isRunning) {
        await Location.stopLocationUpdatesAsync(GPS_TASK_NAME);
    }
    consecutiveFailures = 0;
}

export async function isStreaming(): Promise<boolean> {
    if (!TaskManager) return false;
    return Location.hasStartedLocationUpdatesAsync(GPS_TASK_NAME);
}

export function getConsecutiveFailures(): number {
    return consecutiveFailures;
}

/**
 * Check if Pi GPS receiver is reachable.
 */
export async function checkPiConnection(): Promise<{ connected: boolean; data?: any }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
        const response = await fetch(`${piUrl}/health`, {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timer);
        if (response.ok) {
            const data = await response.json();
            return { connected: true, data };
        }
        return { connected: false };
    } catch {
        clearTimeout(timer);
        return { connected: false };
    }
}

/**
 * Notify the Pi that a trip has started — enables event detection on the hardware.
 * Non-blocking: if the Pi is unreachable, we don't fail the trip start.
 */
export async function notifyPiTripStart(): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
        const response = await fetch(`${piUrl}/trip/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
        });
        clearTimeout(timer);
        return response.ok;
    } catch {
        clearTimeout(timer);
        console.warn('[GPS] Could not notify Pi of trip start');
        return false;
    }
}

/**
 * Notify the Pi that the trip has ended — puts event detection on standby.
 */
export async function notifyPiTripStop(): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
        const response = await fetch(`${piUrl}/trip/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
        });
        clearTimeout(timer);
        return response.ok;
    } catch {
        clearTimeout(timer);
        console.warn('[GPS] Could not notify Pi of trip stop');
        return false;
    }
}
