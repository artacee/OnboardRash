/**
 * Hidden Admin / Demo Control Page
 *
 * Two modes:
 *   1. Direct Demo — bypasses the Pi, streams GPS from phone, injects fake events.
 *   2. Pi Connect  — talks to the real Pi's demo server; events are buffered on the
 *                    Pi and only sent to the dashboard when you confirm them here.
 *
 * Access: triple-tap the version text on the Profile page.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Switch,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { PressableScale } from '@/components/ui/PressableScale';
import { PulseDot } from '@/components/ui/PulseDot';
import { Background } from '@/components/ui/Background';
import { GradientTitle, GRADIENT_PRESETS } from '@/components/ui/GradientTitle';
import { SectionLabel, SECTION_DOT_COLORS } from '@/components/ui/SectionLabel';
import { theme, severityColors, eventTypeLabels } from '@/constants/theme';
import * as api from '@/services/api';
import type { Bus, ProfileResponse } from '@/types';
import type { PiPendingEvent, PiStatusResponse } from '@/services/api';

// ═══ Realistic Sensor Payloads ═══
// Values match thresholds in simulator.py / main_pi.py so the backend
// processes them identically to real hardware detections.

type SeverityKey = 'HIGH' | 'MEDIUM' | 'LOW';

const SENSOR_PAYLOADS: Record<string, Record<SeverityKey, {
    acceleration_x: number;
    acceleration_y: number;
    acceleration_z: number;
}>> = {
    HARSH_BRAKE: {
        HIGH:   { acceleration_x: -1.9, acceleration_y: 0.08, acceleration_z: 1.0 },
        MEDIUM: { acceleration_x: -1.6, acceleration_y: 0.05, acceleration_z: 1.0 },
        LOW:    { acceleration_x: -1.2, acceleration_y: 0.03, acceleration_z: 1.0 },
    },
    HARSH_ACCEL: {
        HIGH:   { acceleration_x: 1.4, acceleration_y: 0.06, acceleration_z: 1.0 },
        MEDIUM: { acceleration_x: 1.15, acceleration_y: 0.04, acceleration_z: 1.0 },
        LOW:    { acceleration_x: 0.9, acceleration_y: 0.02, acceleration_z: 1.0 },
    },
    AGGRESSIVE_TURN: {
        HIGH:   { acceleration_x: 0.12, acceleration_y: 1.15, acceleration_z: 0.92 },
        MEDIUM: { acceleration_x: 0.08, acceleration_y: 0.9, acceleration_z: 0.95 },
        LOW:    { acceleration_x: 0.05, acceleration_y: 0.7, acceleration_z: 0.98 },
    },
    TAILGATING: {
        HIGH:   { acceleration_x: 0.0, acceleration_y: 0.0, acceleration_z: 1.0 },
        MEDIUM: { acceleration_x: 0.0, acceleration_y: 0.0, acceleration_z: 1.0 },
        LOW:    { acceleration_x: 0.0, acceleration_y: 0.0, acceleration_z: 1.0 },
    },
    CLOSE_OVERTAKING: {
        HIGH:   { acceleration_x: 0.0, acceleration_y: 0.0, acceleration_z: 1.0 },
        MEDIUM: { acceleration_x: 0.0, acceleration_y: 0.0, acceleration_z: 1.0 },
        LOW:    { acceleration_x: 0.0, acceleration_y: 0.0, acceleration_z: 1.0 },
    },
};

const EVENT_TYPES = Object.keys(SENSOR_PAYLOADS);
const SEVERITIES: SeverityKey[] = ['HIGH', 'MEDIUM', 'LOW'];

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    HARSH_BRAKE: 'stop-circle-outline',
    HARSH_ACCEL: 'speedometer-outline',
    AGGRESSIVE_TURN: 'git-compare-outline',
    TAILGATING: 'car-outline',
    CLOSE_OVERTAKING: 'swap-horizontal-outline',
};

// Speed range per event (km/h) — makes payloads more believable
const EVENT_SPEED_RANGE: Record<string, [number, number]> = {
    HARSH_BRAKE: [35, 70],
    HARSH_ACCEL: [15, 45],
    AGGRESSIVE_TURN: [30, 55],
    TAILGATING: [40, 65],
    CLOSE_OVERTAKING: [45, 75],
};

// ═══ Main Component ═══

export default function AdminScreen() {
    const router = useRouter();

    // ─── State ───────────────────────────────────────────
    const [busId, setBusId] = useState<number | null>(null);
    const [busReg, setBusReg] = useState<string>('');
    const [buses, setBuses] = useState<Bus[]>([]);
    const [loadingBus, setLoadingBus] = useState(true);
    const [hasActiveTrip, setHasActiveTrip] = useState(false);
    const [tripLoading, setTripLoading] = useState(false);

    const [severity, setSeverity] = useState<SeverityKey>('HIGH');
    const [gpsStreaming, setGpsStreaming] = useState(false);
    const [currentLat, setCurrentLat] = useState<number | null>(null);
    const [currentLng, setCurrentLng] = useState<number | null>(null);
    const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
    const [currentHeading, setCurrentHeading] = useState<number | null>(null);
    const [gpsSendCount, setGpsSendCount] = useState(0);
    const [eventsSent, setEventsSent] = useState(0);
    const [lastStatus, setLastStatus] = useState<string>('');
    const [sendingEvent, setSendingEvent] = useState<string | null>(null);

    // Speed override
    const [speedOverride, setSpeedOverride] = useState(true);
    const [overrideSpeed, setOverrideSpeed] = useState(48); // km/h

    // Backend health
    const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
    const [checkingHealth, setCheckingHealth] = useState(true);

    // Reset
    const [resetting, setResetting] = useState(false);

    // ─── Pi Connect Mode ──────────────────────────────────
    const [piConnectMode, setPiConnectMode] = useState(false);
    const [piIp, setPiIp] = useState('');
    const [piUrl, setPiUrl] = useState('');
    const [piOnline, setPiOnline] = useState<boolean | null>(null);
    const [piChecking, setPiChecking] = useState(false);
    const [piStatus, setPiStatus] = useState<PiStatusResponse | null>(null);
    const [pendingEvents, setPendingEvents] = useState<PiPendingEvent[]>([]);
    const [confirmingEvent, setConfirmingEvent] = useState<number | null>(null);
    const piPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const watchRef = useRef<Location.LocationSubscription | null>(null);
    const lastLocationRef = useRef<{ lat: number; lng: number; speed: number | null; heading: number | null }>({
        lat: 0, lng: 0, speed: null, heading: null,
    });

    // ─── Backend health check on mount ──────────────────
    const checkHealth = useCallback(async () => {
        setCheckingHealth(true);
        const ok = await api.checkBackendHealth();
        setBackendOnline(ok);
        setCheckingHealth(false);
    }, []);

    // ─── Load active trip / buses on mount ──────────────
    useEffect(() => {
        checkHealth();

        (async () => {
            try {
                const profile: ProfileResponse = await api.getProfile();
                if (profile.active_trip) {
                    setBusId(profile.active_trip.bus_id);
                    setBusReg(profile.active_trip.bus_registration || `Bus #${profile.active_trip.bus_id}`);
                    setHasActiveTrip(true);
                    setLoadingBus(false);
                    return;
                }
            } catch { /* ignore */ }

            // No active trip — load bus list for manual pick
            try {
                const data = await api.getBuses();
                setBuses(data.buses || []);
                if (data.buses?.length) {
                    setBusId(data.buses[0].id);
                    setBusReg(data.buses[0].registration_number);
                }
            } catch { /* ignore */ }
            setLoadingBus(false);
        })();

        return () => {
            watchRef.current?.remove();
            if (piPollRef.current) clearInterval(piPollRef.current);
        };
    }, []);

    // ─── Pi Connect: load saved IP on mount ─────────────
    useEffect(() => {
        (async () => {
            const saved = await api.loadPiUrl();
            if (saved) {
                // Extract IP from URL like http://192.168.43.100:8082
                const match = saved.match(/http:\/\/([^:]+)/);
                if (match) setPiIp(match[1]);
                setPiUrl(saved);
            }
        })();
    }, []);

    // ─── Pi Connect: health check + polling ─────────────
    const checkPiHealth = useCallback(async (url?: string) => {
        const target = url || piUrl;
        if (!target) return;
        setPiChecking(true);
        const status = await api.piCheckHealth(target);
        setPiOnline(!!status);
        setPiStatus(status);
        setPiChecking(false);
    }, [piUrl]);

    const fetchPendingEvents = useCallback(async () => {
        if (!piUrl || !piConnectMode) return;
        try {
            const events = await api.piGetPendingEvents(piUrl);
            setPendingEvents(events);
        } catch { /* silent */ }
    }, [piUrl, piConnectMode]);

    // Start/stop polling when Pi Connect mode changes
    useEffect(() => {
        if (piConnectMode && piUrl) {
            checkPiHealth();
            fetchPendingEvents();
            piPollRef.current = setInterval(fetchPendingEvents, 3000);
        } else {
            if (piPollRef.current) {
                clearInterval(piPollRef.current);
                piPollRef.current = null;
            }
            setPendingEvents([]);
        }
        return () => {
            if (piPollRef.current) clearInterval(piPollRef.current);
        };
    }, [piConnectMode, piUrl]);

    // ─── Pi Connect: save IP and build URL ──────────────
    const handlePiIpChange = useCallback(async (ip: string) => {
        setPiIp(ip);
        const url = ip.trim() ? `http://${ip.trim()}:8082` : '';
        setPiUrl(url);
        if (url) {
            await api.persistPiUrl(url);
            checkPiHealth(url);
        }
    }, [checkPiHealth]);

    // ─── Pi Connect: confirm a pending event ────────────
    const handleConfirmPiEvent = useCallback(async (eventId: number) => {
        if (!piUrl) return;
        setConfirmingEvent(eventId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        const loc = lastLocationRef.current;
        try {
            await api.piConfirmEvent(piUrl, eventId, loc.lat, loc.lng, loc.speed);
            setLastStatus(`✓ Pi event #${eventId} confirmed & sent`);
            setEventsSent((c) => c + 1);
            // Remove from local list immediately
            setPendingEvents((prev) => prev.filter((e) => e.id !== eventId));
        } catch (err: any) {
            setLastStatus(`✗ Pi confirm: ${err.message}`);
        } finally {
            setConfirmingEvent(null);
        }
    }, [piUrl]);

    // ─── Pi Connect: toggle demo-hold mode on Pi ────────
    const handlePiModeToggle = useCallback(async (enabled: boolean) => {
        setPiConnectMode(enabled);

        if (enabled) {
            // Auto-discover Pi IP from backend (no manual entry needed)
            const info = await api.discoverPi(busReg || undefined);
            if (info?.pi_ip) {
                const discoveredIp = info.pi_ip;
                const discoveredUrl = `http://${discoveredIp}:${info.demo_port}`;
                setPiIp(discoveredIp);
                setPiUrl(discoveredUrl);
                await api.persistPiUrl(discoveredUrl);
                checkPiHealth(discoveredUrl);
            }
        }

        if (piUrl) {
            try {
                await api.piSetMode(piUrl, enabled);
            } catch { /* Pi may not be reachable yet */ }
        }
    }, [piUrl, busReg, checkPiHealth]);

    // ─── GPS Stream (Direct to Backend) ─────────────────

    const startGps = useCallback(async () => {
        if (!busId) {
            Alert.alert('No Bus', 'Select a bus first');
            return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Location permission is required');
            return;
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const sub = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.BestForNavigation,
                timeInterval: 2000,
                distanceInterval: 0,
            },
            async (loc) => {
                const lat = loc.coords.latitude;
                const lng = loc.coords.longitude;
                const realSpeed = loc.coords.speed !== null ? loc.coords.speed * 3.6 : null; // m/s → km/h
                const heading = loc.coords.heading;

                // Apply speed override — jitter ±5 km/h for realism
                const effectiveSpeed = speedOverride
                    ? overrideSpeed + (Math.random() * 10 - 5)
                    : realSpeed;

                setCurrentLat(lat);
                setCurrentLng(lng);
                setCurrentSpeed(effectiveSpeed);
                setCurrentHeading(heading);

                lastLocationRef.current = { lat, lng, speed: effectiveSpeed, heading };

                try {
                    await api.updateBusLocation(busId!, lat, lng, effectiveSpeed, heading);
                    setGpsSendCount((c) => c + 1);
                } catch {
                    // Silently continue — status shows on UI
                }
            },
        );

        watchRef.current = sub;
        setGpsStreaming(true);
        setLastStatus('GPS stream started');
    }, [busId, speedOverride, overrideSpeed]);

    const stopGps = useCallback(() => {
        watchRef.current?.remove();
        watchRef.current = null;
        setGpsStreaming(false);
        setLastStatus('GPS stream stopped');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    // ─── Event Injection ────────────────────────────────

    const sendEvent = useCallback(async (eventType: string) => {
        if (!busId) {
            Alert.alert('No Bus', 'Select a bus first');
            return;
        }

        const loc = lastLocationRef.current;
        if (!loc.lat && !loc.lng) {
            // Try to get a one-shot position
            try {
                const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                loc.lat = pos.coords.latitude;
                loc.lng = pos.coords.longitude;
                loc.speed = pos.coords.speed !== null ? pos.coords.speed * 3.6 : null;
            } catch {
                Alert.alert('No GPS', 'Could not get location. Start GPS stream first.');
                return;
            }
        }

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setSendingEvent(eventType);

        // ── Pi Connect Mode: route through Pi ──
        if (piConnectMode && piUrl) {
            try {
                await api.piInjectEvent(piUrl, eventType, severity, loc.lat, loc.lng, loc.speed);
                setEventsSent((c) => c + 1);
                setLastStatus(`✓ Pi: ${eventTypeLabels[eventType]} (${severity}) with evidence`);
            } catch (err: any) {
                setLastStatus(`✗ Pi inject: ${err.message}`);
            } finally {
                setTimeout(() => setSendingEvent(null), 300);
            }
            return;
        }

        // ── Direct Demo Mode: send to backend ──
        const sensorData = SENSOR_PAYLOADS[eventType][severity];
        const [minSpd, maxSpd] = EVENT_SPEED_RANGE[eventType];
        const speed = loc.speed ?? (minSpd + Math.random() * (maxSpd - minSpd));

        try {
            await api.injectEvent({
                bus_id: busId,
                event_type: eventType,
                severity,
                acceleration_x: sensorData.acceleration_x,
                acceleration_y: sensorData.acceleration_y,
                acceleration_z: sensorData.acceleration_z,
                speed: Math.round(speed * 10) / 10,
                location: { lat: loc.lat, lng: loc.lng },
            });
            setEventsSent((c) => c + 1);
            setLastStatus(`✓ ${eventTypeLabels[eventType]} (${severity})`);
        } catch (err: any) {
            setLastStatus(`✗ Failed: ${err.message}`);
        } finally {
            setTimeout(() => setSendingEvent(null), 300);
        }
    }, [busId, severity]);

    // ─── Bus Picker ─────────────────────────────────────

    const pickBus = (bus: Bus) => {
        setBusId(bus.id);
        setBusReg(bus.registration_number);
        Haptics.selectionAsync();
    };

    // ─── Quick Trip Start ───────────────────────────────

    const handleQuickTrip = useCallback(async () => {
        if (!busId) {
            Alert.alert('No Bus', 'Select a bus first');
            return;
        }
        setTripLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            await api.startTrip(busId, busReg);
            setHasActiveTrip(true);
            setLastStatus('✓ Trip started');
        } catch (err: any) {
            setLastStatus(`✗ Trip: ${err.message}`);
        } finally {
            setTripLoading(false);
        }
    }, [busId, busReg]);

    const handleStopTrip = useCallback(async () => {
        setTripLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        try {
            await api.stopTrip();
            setHasActiveTrip(false);
            setLastStatus('✓ Trip ended');
        } catch (err: any) {
            setLastStatus(`✗ Stop trip: ${err.message}`);
        } finally {
            setTripLoading(false);
        }
    }, []);

    // ─── Reset Events ───────────────────────────────────

    const handleReset = useCallback(() => {
        Alert.alert(
            'Reset All Events',
            'This will delete every event from the database. The dashboard will be clean for your demo.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                        setResetting(true);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                        try {
                            const result = await api.resetEvents();
                            setEventsSent(0);
                            setLastStatus(`✓ ${result.message}`);
                        } catch (err: any) {
                            setLastStatus(`✗ Reset: ${err.message}`);
                        } finally {
                            setResetting(false);
                        }
                    },
                },
            ],
        );
    }, []);

    // ─── Speed Override Cycling ──────────────────────────

    const SPEED_PRESETS = [8, 19, 24, 35, 48, 60, 75];

    const cycleSpeed = () => {
        const idx = SPEED_PRESETS.indexOf(overrideSpeed);
        const next = SPEED_PRESETS[(idx + 1) % SPEED_PRESETS.length];
        setOverrideSpeed(next);
        Haptics.selectionAsync();
    };

    // ─── Render ─────────────────────────────────────────

    return (
        <SafeAreaView style={styles.container}>
            <Background variant="portrait" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <AnimatedEntry delay={0}>
                    <View style={styles.headerRow}>
                        <PressableScale onPress={() => router.back()}>
                            <View style={styles.backButton}>
                                <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
                            </View>
                        </PressableScale>
                        <GradientTitle text="Demo Control" colors={GRADIENT_PRESETS.profile} fontSize={theme.fontSize.title2} />
                        <View style={{ width: 36 }} />
                    </View>
                </AnimatedEntry>

                {/* ── Backend Health ── */}
                <AnimatedEntry delay={60} type="scale">
                    <GlassCard tier={0} style={styles.healthCard}>
                        <View style={styles.healthRow}>
                            {checkingHealth ? (
                                <ActivityIndicator size="small" color={theme.colors.textTertiary} />
                            ) : (
                                <PulseDot
                                    color={backendOnline ? theme.colors.safe : theme.colors.danger}
                                    size={10}
                                    active={!!backendOnline}
                                />
                            )}
                            <Text style={styles.healthText}>
                                Backend: {checkingHealth ? 'Checking…' : backendOnline ? 'Online' : 'Offline'}
                            </Text>
                            <PressableScale onPress={checkHealth}>
                                <View style={styles.refreshBtn}>
                                    <Ionicons name="refresh" size={16} color={theme.colors.textTertiary} />
                                </View>
                            </PressableScale>
                        </View>
                    </GlassCard>
                </AnimatedEntry>

                {/* ── Pi Connect Mode Toggle ── */}
                <AnimatedEntry delay={80} type="scale">
                    <GlassCard tier={0} style={styles.sectionCard}>
                        <SectionLabel text="Mode" dotColor="#a78bfa" />
                        <View style={styles.piModeRow}>
                            <View style={styles.piModeLabel}>
                                <Ionicons
                                    name={piConnectMode ? 'hardware-chip-outline' : 'phone-portrait-outline'}
                                    size={18}
                                    color={piConnectMode ? '#a78bfa' : theme.colors.textTertiary}
                                />
                                <Text style={styles.piModeLabelText}>
                                    {piConnectMode ? 'Pi Connect' : 'Direct Demo'}
                                </Text>
                            </View>
                            <Switch
                                value={piConnectMode}
                                onValueChange={handlePiModeToggle}
                                trackColor={{ false: theme.colors.divider, true: '#a78bfa' }}
                                thumbColor={theme.colors.white}
                            />
                        </View>

                        {piConnectMode && (
                            <View style={styles.piConnectSection}>
                                {/* Pi IP Input */}
                                <View style={styles.piIpRow}>
                                    <Text style={styles.piIpLabel}>Pi IP:</Text>
                                    <TextInput
                                        style={styles.piIpInput}
                                        value={piIp}
                                        onChangeText={handlePiIpChange}
                                        placeholder="192.168.43.100"
                                        placeholderTextColor={theme.colors.textQuaternary}
                                        keyboardType="numeric"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <PressableScale onPress={() => checkPiHealth()}>
                                        <View style={styles.refreshBtn}>
                                            <Ionicons name="refresh" size={16} color={theme.colors.textTertiary} />
                                        </View>
                                    </PressableScale>
                                </View>

                                {/* Pi Status */}
                                <View style={styles.piStatusRow}>
                                    {piChecking ? (
                                        <ActivityIndicator size="small" color={theme.colors.textTertiary} />
                                    ) : (
                                        <PulseDot
                                            color={piOnline ? '#a78bfa' : theme.colors.danger}
                                            size={8}
                                            active={!!piOnline}
                                        />
                                    )}
                                    <Text style={styles.piStatusText}>
                                        Pi: {piChecking ? 'Checking…' : piOnline ? 'Connected' : piUrl ? 'Offline' : 'Enter IP'}
                                    </Text>
                                    {piStatus && (
                                        <Text style={styles.piPendingBadge}>
                                            {piStatus.pending_count} buffered
                                        </Text>
                                    )}
                                </View>

                                {/* Sensor Status */}
                                {piStatus?.sensors && (
                                    <View style={styles.piSensorsRow}>
                                        {Object.entries(piStatus.sensors).filter(([k]) => !['bus', 'bus_id'].includes(k)).map(([key, val]) => (
                                            <View key={key} style={styles.piSensorChip}>
                                                <View style={[
                                                    styles.piSensorDot,
                                                    { backgroundColor: val === 'ok' ? theme.colors.safe : theme.colors.textQuaternary },
                                                ]} />
                                                <Text style={styles.piSensorText}>{key}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}
                    </GlassCard>
                </AnimatedEntry>

                {/* ── Pending Events (Pi Connect only) ── */}
                {piConnectMode && piOnline && pendingEvents.length > 0 && (
                    <AnimatedEntry delay={90} type="fade-up">
                        <GlassCard tier={1} style={styles.sectionCard}>
                            <SectionLabel text={`Pending Events (${pendingEvents.length})`} dotColor="#fbbf24" />
                            <View style={styles.pendingList}>
                                {pendingEvents.map((ev) => {
                                    const isConfirming = confirmingEvent === ev.id;
                                    return (
                                        <View key={ev.id} style={styles.pendingItem}>
                                            <View style={styles.pendingItemLeft}>
                                                <Ionicons
                                                    name={EVENT_ICONS[ev.type] || 'alert-circle-outline'}
                                                    size={20}
                                                    color={ev.severity === 'HIGH' ? theme.colors.danger : theme.colors.warning}
                                                />
                                                <View>
                                                    <Text style={styles.pendingItemType}>
                                                        {eventTypeLabels[ev.type] || ev.type}
                                                    </Text>
                                                    <Text style={styles.pendingItemMeta}>
                                                        {ev.severity} • #{ev.id}
                                                    </Text>
                                                </View>
                                            </View>
                                            <PressableScale onPress={() => handleConfirmPiEvent(ev.id)}>
                                                <View style={[
                                                    styles.confirmBtn,
                                                    isConfirming && { opacity: 0.5 },
                                                ]}>
                                                    {isConfirming ? (
                                                        <ActivityIndicator size="small" color={theme.colors.safeText} />
                                                    ) : (
                                                        <Text style={styles.confirmBtnText}>Confirm</Text>
                                                    )}
                                                </View>
                                            </PressableScale>
                                        </View>
                                    );
                                })}
                            </View>
                        </GlassCard>
                    </AnimatedEntry>
                )}

                {/* ── Bus Info + Trip Control ── */}
                <AnimatedEntry delay={100} type="scale">
                    <GlassCard tier={0} style={styles.busCard}>
                        <SectionLabel text="Bus & Trip" dotColor={SECTION_DOT_COLORS.profile} />
                        {loadingBus ? (
                            <ActivityIndicator color={theme.colors.textTertiary} />
                        ) : busId ? (
                            <View style={styles.busInfoRow}>
                                <Ionicons name="bus-outline" size={20} color={theme.colors.textSecondary} />
                                <Text style={styles.busRegText}>{busReg}</Text>
                                <Text style={styles.busIdText}>ID {busId}</Text>
                            </View>
                        ) : (
                            <Text style={styles.noBusText}>No bus available</Text>
                        )}

                        {/* Bus picker if no active trip */}
                        {!loadingBus && buses.length > 1 && (
                            <View style={styles.busPickerRow}>
                                {buses.map((b) => (
                                    <PressableScale key={b.id} onPress={() => pickBus(b)}>
                                        <View style={[
                                            styles.busChip,
                                            b.id === busId && styles.busChipActive,
                                        ]}>
                                            <Text style={[
                                                styles.busChipText,
                                                b.id === busId && styles.busChipTextActive,
                                            ]}>
                                                {b.registration_number}
                                            </Text>
                                        </View>
                                    </PressableScale>
                                ))}
                            </View>
                        )}

                        {/* Quick Trip Start / Stop */}
                        <View style={styles.tripButtonRow}>
                            {hasActiveTrip ? (
                                <GlassButton
                                    title={tripLoading ? 'Stopping…' : 'Stop Trip'}
                                    variant="danger"
                                    onPress={handleStopTrip}
                                    icon={<Ionicons name="square" size={14} color={theme.colors.dangerText} />}
                                />
                            ) : (
                                <GlassButton
                                    title={tripLoading ? 'Starting…' : 'Quick Start Trip'}
                                    variant="primary"
                                    onPress={handleQuickTrip}
                                    icon={<Ionicons name="play" size={14} color={theme.colors.safeText} />}
                                />
                            )}
                        </View>
                    </GlassCard>
                </AnimatedEntry>

                {/* ── GPS Stream ── */}
                <AnimatedEntry delay={160} type="fade-up">
                    <GlassCard tier={1} style={styles.sectionCard}>
                        <SectionLabel text="GPS → Backend (Direct)" dotColor="#34d399" />

                        <View style={styles.gpsStatusRow}>
                            <PulseDot
                                color={gpsStreaming ? theme.colors.safe : theme.colors.textQuaternary}
                                size={10}
                                active={gpsStreaming}
                            />
                            <Text style={styles.gpsStatusText}>
                                {gpsStreaming ? 'Streaming' : 'Idle'}
                            </Text>
                            <Text style={styles.gpsSendCount}>{gpsSendCount} sent</Text>
                        </View>

                        {currentLat !== null && (
                            <View style={styles.gpsCoords}>
                                <Text style={styles.coordText}>
                                    {currentLat.toFixed(6)}, {currentLng?.toFixed(6)}
                                </Text>
                                {currentSpeed !== null && (
                                    <Text style={styles.coordText}>
                                        {currentSpeed.toFixed(1)} km/h{speedOverride ? ' (overridden)' : ''} • {currentHeading?.toFixed(0)}°
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Speed Override */}
                        <View style={styles.speedOverrideRow}>
                            <View style={styles.speedOverrideLabel}>
                                <Ionicons name="speedometer-outline" size={16} color={theme.colors.textTertiary} />
                                <Text style={styles.speedOverrideLabelText}>Speed Override</Text>
                            </View>
                            <Switch
                                value={speedOverride}
                                onValueChange={setSpeedOverride}
                                trackColor={{ false: theme.colors.divider, true: theme.colors.safe }}
                                thumbColor={theme.colors.white}
                            />
                        </View>
                        {speedOverride && (
                            <PressableScale onPress={cycleSpeed}>
                                <View style={styles.speedPresetRow}>
                                    <Text style={styles.speedPresetText}>~{overrideSpeed} km/h</Text>
                                    <Text style={styles.speedPresetHint}>(tap to cycle)</Text>
                                </View>
                            </PressableScale>
                        )}

                        <GlassButton
                            title={gpsStreaming ? 'Stop GPS Stream' : 'Start GPS Stream'}
                            variant={gpsStreaming ? 'danger' : 'primary'}
                            onPress={gpsStreaming ? stopGps : startGps}
                            icon={
                                <Ionicons
                                    name={gpsStreaming ? 'stop-circle' : 'navigate'}
                                    size={18}
                                    color={gpsStreaming ? theme.colors.dangerText : theme.colors.safeText}
                                />
                            }
                        />
                    </GlassCard>
                </AnimatedEntry>

                {/* ── Severity Toggle ── */}
                <AnimatedEntry delay={240} type="fade-up">
                    <GlassCard tier={1} style={styles.sectionCard}>
                        <SectionLabel text="Event Severity" dotColor={severityColors[severity].color} />
                        <View style={styles.severityRow}>
                            {SEVERITIES.map((s) => (
                                <PressableScale key={s} onPress={() => { setSeverity(s); Haptics.selectionAsync(); }}>
                                    <View style={[
                                        styles.severityChip,
                                        { backgroundColor: s === severity ? severityColors[s].color : 'transparent' },
                                        s === severity && styles.severityChipActive,
                                    ]}>
                                        <Text style={[
                                            styles.severityChipText,
                                            { color: s === severity ? '#fff' : theme.colors.textTertiary },
                                        ]}>
                                            {s}
                                        </Text>
                                    </View>
                                </PressableScale>
                            ))}
                        </View>
                    </GlassCard>
                </AnimatedEntry>

                {/* ── Event Buttons ── */}
                <AnimatedEntry delay={320} type="fade-up">
                    <GlassCard tier={1} style={styles.sectionCard}>
                        <SectionLabel
                            text={piConnectMode ? 'Inject Events (via Pi)' : 'Inject Events'}
                            dotColor={theme.colors.danger}
                        />
                        {piConnectMode && (
                            <Text style={styles.piInjectHint}>
                                Events route through Pi → real camera evidence
                            </Text>
                        )}
                        <View style={styles.eventGrid}>
                            {EVENT_TYPES.map((type) => {
                                const isSending = sendingEvent === type;
                                return (
                                    <PressableScale key={type} onPress={() => sendEvent(type)}>
                                        <View style={[
                                            styles.eventButton,
                                            isSending && { backgroundColor: severityColors[severity].color },
                                        ]}>
                                            <Ionicons
                                                name={EVENT_ICONS[type]}
                                                size={24}
                                                color={isSending ? '#fff' : theme.colors.textSecondary}
                                            />
                                            <Text style={[
                                                styles.eventButtonLabel,
                                                isSending && { color: '#fff' },
                                            ]}>
                                                {eventTypeLabels[type]}
                                            </Text>
                                        </View>
                                    </PressableScale>
                                );
                            })}
                        </View>
                    </GlassCard>
                </AnimatedEntry>

                {/* ── Status Footer ── */}
                <AnimatedEntry delay={400} type="fade-up">
                    <GlassCard tier={2} style={styles.statusCard}>
                        <View style={styles.statusRow}>
                            <View style={styles.statusItem}>
                                <Text style={styles.statusValue}>{eventsSent}</Text>
                                <Text style={styles.statusLabel}>Events Sent</Text>
                            </View>
                            <View style={styles.statusDivider} />
                            <View style={styles.statusItem}>
                                <Text style={styles.statusValue}>{gpsSendCount}</Text>
                                <Text style={styles.statusLabel}>GPS Updates</Text>
                            </View>
                        </View>
                        {lastStatus ? (
                            <Text style={[
                                styles.lastStatusText,
                                { color: lastStatus.startsWith('✓') ? theme.colors.safeText
                                    : lastStatus.startsWith('✗') ? theme.colors.dangerText
                                    : theme.colors.textTertiary },
                            ]}>
                                {lastStatus}
                            </Text>
                        ) : null}
                    </GlassCard>
                </AnimatedEntry>

                {/* ── Reset Events ── */}
                <AnimatedEntry delay={480} type="fade-up">
                    <GlassCard tier={2} style={styles.resetCard}>
                        <GlassButton
                            title={resetting ? 'Resetting…' : 'Reset All Events'}
                            variant="danger"
                            onPress={handleReset}
                            icon={
                                resetting
                                    ? <ActivityIndicator size="small" color={theme.colors.dangerText} />
                                    : <Ionicons name="trash-outline" size={16} color={theme.colors.dangerText} />
                            }
                        />
                        <Text style={styles.resetHint}>Clears every event from the database for a clean demo</Text>
                    </GlassCard>
                </AnimatedEntry>

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ═══ Styles ═══

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.base,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xl,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.glassTier0,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Health card
    healthCard: {
        marginBottom: theme.spacing.base,
        paddingVertical: theme.spacing.md,
    },
    healthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    healthText: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
        flex: 1,
    },
    refreshBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.glassTier0,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Bus card
    busCard: {
        marginBottom: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
    },
    busInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    busRegText: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.title3,
        fontWeight: theme.fontWeight.title,
        color: theme.colors.textPrimary,
    },
    busIdText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        color: theme.colors.textTertiary,
        marginLeft: 'auto',
    },
    noBusText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.sm,
    },
    busPickerRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.base,
    },
    busChip: {
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    busChipActive: {
        borderColor: theme.colors.safe,
        backgroundColor: theme.colors.safeBg,
    },
    busChipText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        color: theme.colors.textTertiary,
    },
    busChipTextActive: {
        color: theme.colors.safeText,
        fontFamily: theme.fonts.headline,
    },
    tripButtonRow: {
        marginTop: theme.spacing.base,
    },

    // Section card
    sectionCard: { marginBottom: theme.spacing.xl },

    // GPS
    gpsStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.base,
    },
    gpsStatusText: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
    },
    gpsSendCount: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        color: theme.colors.textTertiary,
        marginLeft: 'auto',
    },
    gpsCoords: {
        marginBottom: theme.spacing.base,
        gap: theme.spacing.xs,
    },
    coordText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        color: theme.colors.textSecondary,
    },

    // Speed override
    speedOverrideRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    speedOverrideLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    speedOverrideLabelText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        color: theme.colors.textSecondary,
    },
    speedPresetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.base,
        paddingHorizontal: theme.spacing.sm,
    },
    speedPresetText: {
        fontFamily: theme.fonts.display,
        fontSize: theme.fontSize.title3,
        fontWeight: theme.fontWeight.display,
        color: theme.colors.textPrimary,
    },
    speedPresetHint: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        color: theme.colors.textQuaternary,
    },

    // Severity
    severityRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    severityChip: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    severityChipActive: {
        borderColor: 'transparent',
    },
    severityChipText: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.headline,
    },

    // Events grid
    eventGrid: {
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    eventButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.base,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.glassTier0,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
    },
    eventButtonLabel: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
    },

    // Status footer
    statusCard: {
        marginBottom: theme.spacing.base,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    statusDivider: {
        width: 1,
        height: 30,
        backgroundColor: theme.colors.divider,
    },
    statusValue: {
        fontFamily: theme.fonts.display,
        fontSize: theme.fontSize.title2,
        fontWeight: theme.fontWeight.display,
        color: theme.colors.textPrimary,
    },
    statusLabel: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.xs,
    },
    lastStatusText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
    },

    // Reset
    resetCard: {
        marginBottom: theme.spacing.base,
    },
    resetHint: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        color: theme.colors.textQuaternary,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
    },

    // Pi Connect Mode
    piModeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.sm,
    },
    piModeLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    piModeLabelText: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
    },
    piConnectSection: {
        marginTop: theme.spacing.base,
        gap: theme.spacing.sm,
    },
    piIpRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    piIpLabel: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        color: theme.colors.textSecondary,
    },
    piIpInput: {
        flex: 1,
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        color: theme.colors.textPrimary,
        backgroundColor: theme.colors.glassTier0,
        borderRadius: theme.radius.md,
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
    },
    piStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    piStatusText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        color: theme.colors.textSecondary,
        flex: 1,
    },
    piPendingBadge: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.caption,
        fontWeight: theme.fontWeight.headline,
        color: '#fbbf24',
        backgroundColor: 'rgba(251,191,36,0.12)',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radius.full,
    },
    piSensorsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    piSensorChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.glassTier0,
    },
    piSensorDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    piSensorText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        color: theme.colors.textTertiary,
        textTransform: 'capitalize',
    },

    // Pending events list
    pendingList: {
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    pendingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.glassTier0,
        borderWidth: 1,
        borderColor: theme.colors.glassBorder,
    },
    pendingItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        flex: 1,
    },
    pendingItemType: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
    },
    pendingItemMeta: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        color: theme.colors.textTertiary,
    },
    confirmBtn: {
        backgroundColor: theme.colors.safeBg,
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderColor: theme.colors.safe,
    },
    confirmBtnText: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.safeText,
    },

    // Pi inject hint
    piInjectHint: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        color: '#a78bfa',
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
});
