/**
 * GPS Streaming Service
 * 
 * Uses expo-location to capture GPS data and POST it to the Raspberry Pi's
 * local PhoneGPSReceiver endpoint at 2Hz via the phone's WiFi hotspot.
 * 
 * Runs as a foreground service so GPS continues when screen is off.
 */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as SecureStore from 'expo-secure-store';

const GPS_TASK_NAME = 'ONBOARDRASH_GPS_STREAM';

// Default Pi address on Android hotspot (phone acts as gateway at .43.1)
let piUrl = 'http://192.168.43.1:8081';

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

TaskManager.defineTask(GPS_TASK_NAME, async ({ data, error }: any) => {
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
    const isRunning = await Location.hasStartedLocationUpdatesAsync(GPS_TASK_NAME);
    if (isRunning) {
        await Location.stopLocationUpdatesAsync(GPS_TASK_NAME);
    }
    consecutiveFailures = 0;
}

export async function isStreaming(): Promise<boolean> {
    return Location.hasStartedLocationUpdatesAsync(GPS_TASK_NAME);
}

export function getConsecutiveFailures(): number {
    return consecutiveFailures;
}

/**
 * Check if Pi GPS receiver is reachable.
 */
export async function checkPiConnection(): Promise<{ connected: boolean; data?: any }> {
    try {
        const response = await fetch(`${piUrl}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });
        if (response.ok) {
            const data = await response.json();
            return { connected: true, data };
        }
        return { connected: false };
    } catch {
        return { connected: false };
    }
}
