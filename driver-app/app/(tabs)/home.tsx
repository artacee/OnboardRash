/**
 * Home / Trip Screen — Premium driver interface.
 * 
 * Features:
 * - Animated Score Arc (Apple Watch activity ring)
 * - Pulsing morphing trip button with haptics
 * - Breathing pulse status dots
 * - Live trip timer
 * - Severity glow alert cards
 * - Staggered card entrance animations
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/ui/GlassCard';
import { ScoreArc } from '@/components/ui/ScoreArc';
import { TripButton } from '@/components/ui/TripButton';
import { PulseDot } from '@/components/ui/PulseDot';
import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { theme, severityColors, eventTypeLabels } from '@/constants/theme';
import * as api from '@/services/api';
import * as gps from '@/services/gpsStreamer';

export default function HomeScreen() {
    const [profile, setProfile] = useState<any>(null);
    const [activeTrip, setActiveTrip] = useState<any>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [piConnected, setPiConnected] = useState(false);
    const [gpsStreaming, setGpsStreaming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

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

    // ─── Data Fetching ───────────────────────────────────
    const fetchData = useCallback(async () => {
        try {
            const profileData = await api.getProfile();
            setProfile(profileData);
            setActiveTrip(profileData.active_trip);
            const eventsData = await api.getMyEvents();
            setEvents(eventsData.events?.slice(0, 5) || []);
        } catch { }
    }, []);

    const checkConnections = useCallback(async () => {
        const piStatus = await gps.checkPiConnection();
        setPiConnected(piStatus.connected);
        const streaming = await gps.isStreaming();
        setGpsStreaming(streaming);
    }, []);

    useEffect(() => {
        fetchData();
        checkConnections();
        const interval = setInterval(() => {
            fetchData();
            checkConnections();
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const onRefresh = async () => {
        Haptics.selectionAsync();
        setRefreshing(true);
        await fetchData();
        await checkConnections();
        setRefreshing(false);
    };

    // ─── Trip Actions ────────────────────────────────────
    const handleStartTrip = async () => {
        setLoading(true);
        try {
            const started = await gps.startGPSStream();
            if (!started) {
                Alert.alert('Permission Required', 'Location permissions are needed.');
                setLoading(false);
                return;
            }
            setGpsStreaming(true);
            const result = await api.startTrip();
            setActiveTrip(result.trip);
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

    const tripScore = activeTrip?.score ?? 100;

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
                                <PulseDot active={!!activeTrip} color={theme.colors.warning} />
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
                                                    {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : ''}
                                                </Text>
                                            </View>
                                            {isHigh && (
                                                <Ionicons name="alert-circle" size={18} color={theme.colors.danger} />
                                            )}
                                        </View>
                                    </AnimatedEntry>
                                );
                            })}
                        </GlassCard>
                    </AnimatedEntry>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.base,
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
});
