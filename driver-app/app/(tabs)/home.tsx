/**
 * Home / Trip Screen — Premium driver interface.
 * 
 * Features:
 * - Animated Score Arc (Apple Watch activity ring)
 * - Pulsing morphing trip button with haptics
 * - Breathing pulse status dots
 * - Live trip timer
 * - Severity glow alert cards
 * - Real-time events via Socket.IO
 * - Bus selection before trip start
 * - Loading skeletons & error states
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    RefreshControl,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ScoreArc } from '@/components/ui/ScoreArc';
import { TripButton } from '@/components/ui/TripButton';
import { PulseDot } from '@/components/ui/PulseDot';
import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { theme, severityColors, eventTypeLabels } from '@/constants/theme';
import * as api from '@/services/api';
import * as gps from '@/services/gpsStreamer';
import { useSocketIO } from '@/hooks/useSocketIO';
import type { ProfileResponse, DrivingEvent, Trip, Bus } from '@/types';

export default function HomeScreen() {
    // ─── State (typed) ───────────────────────────────────
    const [profile, setProfile] = useState<ProfileResponse | null>(null);
    const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
    const [events, setEvents] = useState<DrivingEvent[]>([]);
    const [piConnected, setPiConnected] = useState(false);
    const [gpsStreaming, setGpsStreaming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');
    const [initialLoading, setInitialLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Bus selection
    const [buses, setBuses] = useState<Bus[]>([]);
    const [showBusPicker, setShowBusPicker] = useState(false);
    const [busesLoading, setBusesLoading] = useState(false);

    // Event detail modal
    const [selectedEvent, setSelectedEvent] = useState<DrivingEvent | null>(null);

    // Socket.IO for real-time alerts
    const { isConnected: socketConnected, subscribe } = useSocketIO(api.getApiUrl());

    // ─── Live Timer ──────────────────────────────────────
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (activeTrip?.started_at) {
            const startTime = new Date(activeTrip.started_at).getTime();
            timerRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const hours = Math.floor(elapsed / 3600000);
                const mins = Math.floor((elapsed % 3600000) / 60000);
                const secs = Math.floor((elapsed % 60000) / 1000);
                setElapsedTime(
                    `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
                );
            }, 1000);
        } else {
            setElapsedTime('00:00:00');
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [activeTrip?.started_at]);

    // ─── Socket.IO real-time events ──────────────────────
    useEffect(() => {
        const unsubscribe = subscribe('new_alert', (event: DrivingEvent) => {
            // Only add events for our active trip's bus
            if (activeTrip && event.bus_id === activeTrip.bus_id) {
                Haptics.notificationAsync(
                    event.severity === 'HIGH'
                        ? Haptics.NotificationFeedbackType.Error
                        : Haptics.NotificationFeedbackType.Warning
                );
                setEvents(prev => [event, ...prev].slice(0, 10));
            }
        });
        return unsubscribe;
    }, [subscribe, activeTrip?.bus_id]);

    // ─── Data Fetching ───────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            const [profileData, eventsData] = await Promise.all([
                api.getProfile(),
                api.getMyEvents(),
            ]);
            setProfile(profileData);
            setActiveTrip(profileData.active_trip);
            setEvents(eventsData.events?.slice(0, 10) || []);
            setFetchError(null);
        } catch (err: any) {
            setFetchError(err.message || 'Failed to load data');
        } finally {
            setInitialLoading(false);
        }
    }, []);

    const checkConnections = useCallback(async () => {
        const piStatus = await gps.checkPiConnection();
        setPiConnected(piStatus.connected);
        const streaming = await gps.isStreaming();
        setGpsStreaming(streaming);
    }, []);

    // Fetch on mount — no polling (Socket.IO handles real-time)
    useEffect(() => {
        fetchData();
        checkConnections();
        // Periodic connection check only (every 30s, lightweight)
        const interval = setInterval(checkConnections, 30_000);
        return () => clearInterval(interval);
    }, []);

    const onRefresh = async () => {
        Haptics.selectionAsync();
        setRefreshing(true);
        await Promise.all([fetchData(), checkConnections()]);
        setRefreshing(false);
    };

    // ─── Bus Selection ───────────────────────────────────
    const loadBuses = async () => {
        setBusesLoading(true);
        try {
            const data = await api.getBuses();
            setBuses(data.buses || []);
            if (!data.buses || data.buses.length === 0) {
                Alert.alert('No Buses', 'No active buses found. Contact fleet admin.');
                return;
            }
            if (data.buses.length === 1) {
                // Only one bus — skip picker, start immediately
                await doStartTrip(data.buses[0].id, data.buses[0].registration_number);
            } else {
                setShowBusPicker(true);
            }
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to load buses');
        } finally {
            setBusesLoading(false);
        }
    };

    // ─── Trip Actions ────────────────────────────────────
    const handleStartTrip = async () => {
        setLoading(true);
        await loadBuses();
        setLoading(false);
    };

    const doStartTrip = async (busId: number, busRegistration: string) => {
        setLoading(true);
        setShowBusPicker(false);
        try {
            // API call FIRST, then GPS — if API fails, no orphaned GPS stream
            const result = await api.startTrip(busId, busRegistration);
            setActiveTrip(result.trip);

            // Now start GPS streaming
            const started = await gps.startGPSStream();
            if (!started) {
                Alert.alert(
                    'GPS Permission Required',
                    'Location permissions are needed for GPS tracking. The trip has started but GPS data won\'t be recorded.'
                );
            } else {
                setGpsStreaming(true);
            }
            await fetchData();
        } catch (err: any) {
            Alert.alert('Error', err.message || 'Failed to start trip');
        } finally {
            setLoading(false);
        }
    };

    const handleStopTrip = async () => {
        Alert.alert('End Trip', 'Are you sure you want to end this trip?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'End Trip',
                style: 'destructive',
                onPress: async () => {
                    setLoading(true);
                    try {
                        await gps.stopGPSStream();
                        setGpsStreaming(false);
                        const result = await api.stopTrip();
                        setActiveTrip(null);
                        Alert.alert(
                            'Trip Complete',
                            `Score: ${result.trip.score}/100\nEvents: ${result.trip.event_count}`
                        );
                        await fetchData();
                    } catch (err: any) {
                        Alert.alert('Error', err.message || 'Failed to stop trip');
                    } finally {
                        setLoading(false);
                    }
                },
            },
        ]);
    };

    const tripScore = activeTrip?.score ?? profile?.stats?.avg_score ?? 100;

    // ─── Loading Skeleton ────────────────────────────────
    if (initialLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.textTertiary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Error State ─────────────────────────────────────
    if (fetchError && !profile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <GlassCard tier={1} style={styles.errorCard}>
                        <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.danger} />
                        <Text style={styles.errorTitle}>Connection Error</Text>
                        <Text style={styles.errorMessage}>{fetchError}</Text>
                        <GlassButton
                            title="Retry"
                            onPress={() => { setInitialLoading(true); fetchData(); checkConnections(); }}
                            variant="primary"
                            style={{ marginTop: theme.spacing.base }}
                        />
                    </GlassCard>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <AnimatedEntry delay={0}>
                    <View style={styles.header}>
                        <Text style={styles.greeting}>
                            Hello, {profile?.driver?.full_name?.split(' ')[0] || 'Driver'}
                        </Text>
                        <Text style={styles.headerSubtitle}>
                            {activeTrip ? 'Trip in progress' : 'Ready to drive'}
                        </Text>
                    </View>
                </AnimatedEntry>

                {/* ═══ Trip Control Card ═══ */}
                <AnimatedEntry delay={100}>
                    <GlassCard tier={0} style={styles.tripCard}>
                        {/* Score Arc */}
                        <ScoreArc score={tripScore} size={150} strokeWidth={8} />

                        {/* Live Timer */}
                        {activeTrip && (
                            <Animated.View
                                entering={FadeIn.duration(400)}
                                style={styles.timerSection}
                            >
                                <View style={styles.timerDot} />
                                <Text style={styles.timerText}>{elapsedTime}</Text>
                            </Animated.View>
                        )}

                        {/* Trip Button */}
                        <View style={styles.tripButtonSection}>
                            <TripButton
                                isActive={!!activeTrip}
                                onPress={activeTrip ? handleStopTrip : handleStartTrip}
                                loading={loading}
                            />
                        </View>
                    </GlassCard>
                </AnimatedEntry>

                {/* ═══ Status Panel ═══ */}
                <AnimatedEntry delay={200}>
                    <GlassCard tier={1} style={styles.statusCard}>
                        <Text style={styles.sectionTitle}>System Status</Text>
                        <View style={styles.statusGrid}>
                            <View style={styles.statusItem}>
                                <PulseDot active={piConnected} color={theme.colors.safe} />
                                <View>
                                    <Text style={styles.statusLabel}>Detection Unit</Text>
                                    <Text style={styles.statusValue}>
                                        {piConnected ? 'Connected' : 'Disconnected'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.statusItem}>
                                <PulseDot active={gpsStreaming} color={theme.colors.info} />
                                <View>
                                    <Text style={styles.statusLabel}>GPS Stream</Text>
                                    <Text style={styles.statusValue}>
                                        {gpsStreaming ? 'Active (2Hz)' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.statusItem}>
                                <PulseDot active={socketConnected} color={theme.colors.warning} />
                                <View>
                                    <Text style={styles.statusLabel}>Live Alerts</Text>
                                    <Text style={styles.statusValue}>
                                        {socketConnected ? 'Connected' : 'Disconnected'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.statusItem}>
                                <PulseDot active={!!activeTrip} color="#7850dc" />
                                <View>
                                    <Text style={styles.statusLabel}>Trip</Text>
                                    <Text style={styles.statusValue}>
                                        {activeTrip
                                            ? `Active · ${activeTrip.bus_registration || 'Bus'}`
                                            : 'Not started'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </GlassCard>
                </AnimatedEntry>

                {/* ═══ Recent Alerts (with severity glow) ═══ */}
                {events.length > 0 && (
                    <AnimatedEntry delay={300}>
                        <GlassCard tier={1} style={styles.alertsCard}>
                            <Text style={styles.sectionTitle}>Recent Alerts</Text>
                            {events.map((event, index) => {
                                const severity = severityColors[event.severity as keyof typeof severityColors] || severityColors.MEDIUM;
                                const isHigh = event.severity === 'HIGH';
                                return (
                                    <AnimatedEntry key={event.id || index} delay={350 + index * 80}>
                                        <TouchableOpacity
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                setSelectedEvent(event);
                                            }}
                                        >
                                            <View
                                                style={[
                                                    styles.alertRow,
                                                    isHigh && {
                                                        borderLeftWidth: 3,
                                                        borderLeftColor: theme.colors.danger,
                                                        backgroundColor: 'rgba(248, 113, 113, 0.06)',
                                                        borderRadius: theme.radius.sm,
                                                        paddingLeft: theme.spacing.md,
                                                    },
                                                ]}
                                            >
                                                <View style={[styles.severityBadge, { backgroundColor: severity.bg }]}>
                                                    <Text style={[styles.severityText, { color: severity.color }]}>
                                                        {event.severity}
                                                    </Text>
                                                </View>
                                                <View style={styles.alertContent}>
                                                    <Text style={styles.alertType}>
                                                        {eventTypeLabels[event.event_type] || event.event_type}
                                                    </Text>
                                                    <Text style={styles.alertTime}>
                                                        {event.timestamp
                                                            ? new Date(event.timestamp).toLocaleString('en-IN', {
                                                                  day: 'numeric', month: 'short',
                                                                  hour: '2-digit', minute: '2-digit',
                                                              })
                                                            : ''}
                                                    </Text>
                                                </View>
                                                <Ionicons
                                                    name={isHigh ? 'alert-circle' : 'chevron-forward'}
                                                    size={18}
                                                    color={isHigh ? theme.colors.danger : theme.colors.textQuaternary}
                                                />
                                            </View>
                                        </TouchableOpacity>
                                    </AnimatedEntry>
                                );
                            })}
                        </GlassCard>
                    </AnimatedEntry>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ═══ Bus Selection Modal ═══ */}
            <Modal
                visible={showBusPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowBusPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <GlassCard tier={0} style={styles.modalCard}>
                            <Text style={styles.modalTitle}>Select Bus</Text>
                            <Text style={styles.modalSubtitle}>Choose your bus for this trip</Text>

                            {busesLoading ? (
                                <ActivityIndicator size="small" color={theme.colors.textTertiary} style={{ marginVertical: theme.spacing.xl }} />
                            ) : (
                                <ScrollView style={styles.busListScroll} showsVerticalScrollIndicator={false}>
                                    {buses.map((bus) => (
                                        <TouchableOpacity
                                            key={bus.id}
                                            style={styles.busItem}
                                            activeOpacity={0.7}
                                            onPress={() => {
                                                Haptics.selectionAsync();
                                                doStartTrip(bus.id, bus.registration_number);
                                            }}
                                        >
                                            <View style={styles.busIconBg}>
                                                <Ionicons name="bus" size={20} color={theme.colors.info} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.busRegistration}>{bus.registration_number}</Text>
                                                {bus.route && (
                                                    <Text style={styles.busRoute}>{bus.route}</Text>
                                                )}
                                            </View>
                                            <Ionicons name="chevron-forward" size={18} color={theme.colors.textQuaternary} />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}

                            <GlassButton
                                title="Cancel"
                                variant="danger"
                                onPress={() => setShowBusPicker(false)}
                                style={{ marginTop: theme.spacing.base }}
                            />
                        </GlassCard>
                    </View>
                </View>
            </Modal>

            {/* ═══ Event Detail Modal ═══ */}
            <Modal
                visible={!!selectedEvent}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedEvent(null)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setSelectedEvent(null)}
                >
                    <View style={styles.modalContent}>
                        <GlassCard tier={0} style={styles.eventDetailCard}>
                            {selectedEvent && (() => {
                                const severity = severityColors[selectedEvent.severity as keyof typeof severityColors] || severityColors.MEDIUM;
                                return (
                                    <>
                                        <View style={[styles.eventDetailBadge, { backgroundColor: severity.bg }]}>
                                            <Ionicons
                                                name={selectedEvent.severity === 'HIGH' ? 'alert-circle' : selectedEvent.severity === 'MEDIUM' ? 'warning' : 'information-circle'}
                                                size={24}
                                                color={severity.color}
                                            />
                                            <Text style={[styles.eventDetailSeverity, { color: severity.color }]}>
                                                {selectedEvent.severity}
                                            </Text>
                                        </View>
                                        <Text style={styles.eventDetailType}>
                                            {eventTypeLabels[selectedEvent.event_type] || selectedEvent.event_type}
                                        </Text>
                                        <View style={styles.eventDetailGrid}>
                                            {selectedEvent.speed !== null && (
                                                <View style={styles.eventDetailItem}>
                                                    <Ionicons name="speedometer-outline" size={16} color={theme.colors.textTertiary} />
                                                    <Text style={styles.eventDetailLabel}>{Math.round(selectedEvent.speed)} km/h</Text>
                                                </View>
                                            )}
                                            {selectedEvent.timestamp && (
                                                <View style={styles.eventDetailItem}>
                                                    <Ionicons name="time-outline" size={16} color={theme.colors.textTertiary} />
                                                    <Text style={styles.eventDetailLabel}>
                                                        {new Date(selectedEvent.timestamp).toLocaleString('en-IN', {
                                                            day: 'numeric', month: 'short',
                                                            hour: '2-digit', minute: '2-digit', second: '2-digit',
                                                        })}
                                                    </Text>
                                                </View>
                                            )}
                                            {selectedEvent.location?.lat != null && selectedEvent.location?.lng != null && (
                                                <View style={styles.eventDetailItem}>
                                                    <Ionicons name="location-outline" size={16} color={theme.colors.textTertiary} />
                                                    <Text style={styles.eventDetailLabel}>
                                                        {selectedEvent.location.address
                                                            || `${selectedEvent.location.lat.toFixed(4)}, ${selectedEvent.location.lng.toFixed(4)}`}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <GlassButton
                                            title="Dismiss"
                                            onPress={() => setSelectedEvent(null)}
                                            style={{ marginTop: theme.spacing.base }}
                                        />
                                    </>
                                );
                            })()}
                        </GlassCard>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.base,
    },
    // Loading state
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.base,
    },
    loadingText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.body,
        color: theme.colors.textTertiary,
    },
    // Error state
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    errorCard: {
        alignItems: 'center',
        paddingVertical: theme.spacing['3xl'],
        gap: theme.spacing.md,
    },
    errorTitle: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.title3,
        fontWeight: theme.fontWeight.title,
        color: theme.colors.textPrimary,
    },
    errorMessage: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        color: theme.colors.textTertiary,
        textAlign: 'center',
    },
    header: { marginBottom: theme.spacing.xl },
    greeting: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.title1,
        fontWeight: theme.fontWeight.title,
        color: theme.colors.textPrimary,
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.body,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    tripCard: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        paddingVertical: theme.spacing['2xl'],
    },
    timerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: theme.spacing.base,
        marginBottom: theme.spacing.sm,
    },
    timerDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.danger,
    },
    timerText: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.title3,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textSecondary,
        fontVariant: ['tabular-nums'],
        letterSpacing: 1,
    },
    tripButtonSection: {
        width: '100%',
        alignItems: 'center',
        marginTop: theme.spacing.base,
    },
    statusCard: { marginBottom: theme.spacing.xl },
    sectionTitle: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.base,
    },
    statusGrid: { gap: theme.spacing.lg },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    statusLabel: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
    },
    statusValue: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
    },
    alertsCard: { marginBottom: theme.spacing.xl },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    },
    severityBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.xs,
        minWidth: 55,
        alignItems: 'center',
    },
    severityText: {
        fontFamily: theme.fonts.headline,
        fontSize: 10,
        fontWeight: theme.fontWeight.headline,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    alertContent: { flex: 1 },
    alertType: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
    },
    alertTime: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
        marginTop: 2,
    },
    // Bus picker modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: theme.spacing['3xl'],
    },
    modalCard: {
        paddingVertical: theme.spacing.xl,
    },
    modalTitle: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.title2,
        fontWeight: theme.fontWeight.title,
        color: theme.colors.textPrimary,
        letterSpacing: -0.5,
    },
    modalSubtitle: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.xl,
    },
    busListScroll: {
        maxHeight: 280,
    },
    busItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(0, 0, 0, 0.06)',
    },
    busIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: theme.colors.infoBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    busRegistration: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
    },
    busRoute: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        color: theme.colors.textTertiary,
        marginTop: 2,
    },
    // Event detail modal
    eventDetailCard: {
        alignItems: 'center',
        paddingVertical: theme.spacing['2xl'],
    },
    eventDetailBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.base,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        marginBottom: theme.spacing.base,
    },
    eventDetailSeverity: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    eventDetailType: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.title3,
        fontWeight: theme.fontWeight.title,
        color: theme.colors.textPrimary,
        textAlign: 'center',
    },
    eventDetailDesc: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
    },
    eventDetailGrid: {
        marginTop: theme.spacing.xl,
        gap: theme.spacing.md,
        width: '100%',
    },
    eventDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    eventDetailLabel: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        color: theme.colors.textSecondary,
    },
});
