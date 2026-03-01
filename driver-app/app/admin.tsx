/**
 * Hidden Admin / Demo Control Page
 *
 * Bypasses the Raspberry Pi entirely — streams the phone's real GPS
 * directly to the backend and injects driving events with one tap.
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

        return () => { watchRef.current?.remove(); };
    }, []);

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
                        <SectionLabel text="Inject Events" dotColor={theme.colors.danger} />
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
});
