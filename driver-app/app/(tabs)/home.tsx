/**
 * Home / Trip Screen — Main driver interface.
 * 
 * Shows trip control (start/stop), live GPS & Pi status,
 * behavior score, and recent alerts from active trip.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
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

    const fetchData = useCallback(async () => {
        try {
            const profileData = await api.getProfile();
            setProfile(profileData);
            setActiveTrip(profileData.active_trip);

            const eventsData = await api.getMyEvents();
            setEvents(eventsData.events?.slice(0, 5) || []);
        } catch (err) {
            // Silent fail on data fetch
        }
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
        setRefreshing(true);
        await fetchData();
        await checkConnections();
        setRefreshing(false);
    };

    const handleStartTrip = async () => {
        setLoading(true);
        try {
            // Start GPS streaming first
            const started = await gps.startGPSStream();
            if (!started) {
                Alert.alert('Permission Required', 'Location permissions are needed to stream GPS to the detection unit.');
                setLoading(false);
                return;
            }
            setGpsStreaming(true);

            // Start trip on backend
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
    const scoreColor =
        tripScore >= 80 ? theme.colors.safe :
            tripScore >= 50 ? theme.colors.warning :
                theme.colors.danger;

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
                <View style={styles.header}>
                    <Text style={styles.greeting}>
                        Hello, {profile?.driver?.full_name?.split(' ')[0] || 'Driver'}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {activeTrip ? 'Trip in progress' : 'Ready to drive'}
                    </Text>
                </View>

                {/* Trip Control */}
                <GlassCard tier={0} style={styles.tripCard}>
                    {/* Score Ring */}
                    <View style={styles.scoreSection}>
                        <View style={[styles.scoreRing, { borderColor: scoreColor }]}>
                            <Text style={[styles.scoreValue, { color: scoreColor }]}>
                                {Math.round(tripScore)}
                            </Text>
                            <Text style={styles.scoreLabel}>Score</Text>
                        </View>
                    </View>

                    {/* Trip Button */}
                    <View style={styles.tripButtonSection}>
                        {!activeTrip ? (
                            <GlassButton
                                title="Start Trip"
                                variant="primary"
                                onPress={handleStartTrip}
                                loading={loading}
                                icon={<Ionicons name="play" size={20} color="#047857" />}
                                style={styles.tripButton}
                            />
                        ) : (
                            <GlassButton
                                title="End Trip"
                                variant="danger"
                                onPress={handleStopTrip}
                                loading={loading}
                                icon={<Ionicons name="stop" size={20} color="#b91c1c" />}
                                style={styles.tripButton}
                            />
                        )}
                    </View>
                </GlassCard>

                {/* Status Panel */}
                <GlassCard tier={1} style={styles.statusCard}>
                    <Text style={styles.sectionTitle}>System Status</Text>
                    <View style={styles.statusGrid}>
                        {/* Pi Connection */}
                        <View style={styles.statusItem}>
                            <View style={[styles.statusDot, { backgroundColor: piConnected ? theme.colors.safe : theme.colors.danger }]} />
                            <View>
                                <Text style={styles.statusLabel}>Detection Unit</Text>
                                <Text style={styles.statusValue}>
                                    {piConnected ? 'Connected' : 'Disconnected'}
                                </Text>
                            </View>
                        </View>

                        {/* GPS Streaming */}
                        <View style={styles.statusItem}>
                            <View style={[styles.statusDot, { backgroundColor: gpsStreaming ? theme.colors.safe : theme.colors.textQuaternary }]} />
                            <View>
                                <Text style={styles.statusLabel}>GPS Stream</Text>
                                <Text style={styles.statusValue}>
                                    {gpsStreaming ? 'Active (2Hz)' : 'Inactive'}
                                </Text>
                            </View>
                        </View>

                        {/* Trip Status */}
                        <View style={styles.statusItem}>
                            <View style={[styles.statusDot, { backgroundColor: activeTrip ? theme.colors.info : theme.colors.textQuaternary }]} />
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

                {/* Recent Alerts */}
                {events.length > 0 && (
                    <GlassCard tier={1} style={styles.alertsCard}>
                        <Text style={styles.sectionTitle}>Recent Alerts</Text>
                        {events.map((event, index) => {
                            const severity = severityColors[event.severity as keyof typeof severityColors] || severityColors.MEDIUM;
                            return (
                                <View key={event.id || index} style={styles.alertRow}>
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
                                </View>
                            );
                        })}
                    </GlassCard>
                )}

                {/* Bottom spacer for tab bar */}
                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.base,
    },
    header: {
        marginBottom: theme.spacing.xl,
    },
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
    scoreSection: {
        marginBottom: theme.spacing.xl,
    },
    scoreRing: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    scoreValue: {
        fontFamily: theme.fonts.display,
        fontSize: theme.fontSize.display2,
        fontWeight: theme.fontWeight.display,
        letterSpacing: -1,
    },
    scoreLabel: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
        marginTop: -2,
    },
    tripButtonSection: {
        width: '100%',
        alignItems: 'center',
    },
    tripButton: {
        minWidth: 200,
    },
    statusCard: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: theme.spacing.base,
    },
    statusGrid: {
        gap: theme.spacing.base,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
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
    alertsCard: {
        marginBottom: theme.spacing.xl,
    },
    alertRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
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
    alertContent: {
        flex: 1,
    },
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
    },
});
