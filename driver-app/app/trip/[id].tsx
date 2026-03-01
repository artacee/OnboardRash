/**
 * Trip Detail Screen — Shows trip summary, score, and event timeline.
 *
 * Route: /trip/[id]
 * Accessed from History tab by tapping a trip card.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ScoreArc } from '@/components/ui/ScoreArc';
import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { PressableScale } from '@/components/ui/PressableScale';
import { PulseDot } from '@/components/ui/PulseDot';
import { Background } from '@/components/ui/Background';
import { SectionLabel, SECTION_DOT_COLORS } from '@/components/ui/SectionLabel';
import { theme, severityColors, eventTypeLabels } from '@/constants/theme';
import * as api from '@/services/api';
import type { Trip, DrivingEvent } from '@/types';

// ─── Helpers ─────────────────────────────────────────────

function formatDuration(startedAt: string, endedAt: string | null): string {
    const start = new Date(startedAt).getTime();
    const end = endedAt ? new Date(endedAt).getTime() : Date.now();
    const elapsed = end - start;
    const hours = Math.floor(elapsed / 3_600_000);
    const mins = Math.floor((elapsed % 3_600_000) / 60_000);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

// ─── Component ───────────────────────────────────────────

export default function TripDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [trip, setTrip] = useState<Trip | null>(null);
    const [events, setEvents] = useState<DrivingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<DrivingEvent | null>(null);

    const fetchTrip = useCallback(async () => {
        if (!id) return;
        try {
            const data = await api.getTripDetail(Number(id));
            setTrip(data.trip);
            setEvents(data.events);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Failed to load trip');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchTrip();
    }, [fetchTrip]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTrip();
        setRefreshing(false);
    };

    // ─── Severity summary ────────────────────────────────
    const severityCounts = events.reduce(
        (acc, e) => {
            acc[e.severity] = (acc[e.severity] || 0) + 1;
            return acc;
        },
        {} as Record<string, number>,
    );

    // ─── Loading ─────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Background variant="ember" />
                <View style={styles.centered}>
                    <GlassCard tier={1} style={{ alignItems: 'center', paddingVertical: 48 }}>
                        <ScoreArc score={0} size={120} strokeWidth={8} />
                        <Text style={styles.loadingText}>Loading trip...</Text>
                    </GlassCard>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Error ───────────────────────────────────────────
    if (error || !trip) {
        return (
            <SafeAreaView style={styles.container}>
                <Background variant="ember" />
                <View style={styles.centered}>
                    <GlassCard tier={1} style={styles.errorCard}>
                        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.danger} />
                        <Text style={styles.errorTitle}>Could not load trip</Text>
                        <Text style={styles.errorMessage}>{error || 'Trip not found'}</Text>
                        <View style={styles.errorActions}>
                            <GlassButton title="Retry" onPress={() => { setLoading(true); fetchTrip(); }} variant="primary" />
                            <GlassButton title="Go Back" onPress={() => router.back()} />
                        </View>
                    </GlassCard>
                </View>
            </SafeAreaView>
        );
    }

    const scoreColor = trip.score >= 80
        ? theme.colors.safe
        : trip.score >= 50
            ? theme.colors.warning
            : theme.colors.danger;

    return (
        <SafeAreaView style={styles.container}>
            <Background variant="ember" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Back button */}
                <PressableScale
                    style={styles.backButton}
                    onPress={() => router.back()}
                    haptic hapticStyle="light"
                    scaleTo={0.93}
                >
                    <Ionicons name="chevron-back" size={22} color={theme.colors.textSecondary} />
                    <Text style={styles.backLabel}>History</Text>
                </PressableScale>

                {/* ═══ Trip Summary Card ═══ */}
                <AnimatedEntry delay={0} type="scale">
                    <GlassCard tier={0} style={styles.summaryCard} contentStyle={styles.summaryCardContent}>
                        <ScoreArc score={trip.score} size={140} strokeWidth={8} />

                        <Text style={[styles.scoreLabel, { color: scoreColor }]}>
                            {trip.score.toFixed(0)} / 100
                        </Text>

                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={15} color={theme.colors.textTertiary} />
                                <Text style={styles.metaText}>{formatDateTime(trip.started_at)}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={15} color={theme.colors.textTertiary} />
                                <Text style={styles.metaText}>{formatDuration(trip.started_at, trip.ended_at)}</Text>
                            </View>
                        </View>

                        {trip.bus_registration && (
                            <View style={styles.busChip}>
                                <Ionicons name="bus-outline" size={14} color={theme.colors.info} />
                                <Text style={styles.busChipText}>{trip.bus_registration}</Text>
                            </View>
                        )}

                        {trip.is_active && (
                            <Animated.View entering={FadeIn.duration(500)} style={styles.activeBadge}>
                                <View style={styles.activeDot} />
                                <Text style={styles.activeText}>Trip in progress</Text>
                            </Animated.View>
                        )}
                    </GlassCard>
                </AnimatedEntry>

                {/* ═══ Stats Grid (2×2) ═══ */}
                <AnimatedEntry delay={100} type="fade-up">
                    <View style={styles.statsGrid}>
                        <GlassCard tier={1} style={styles.statBox} contentStyle={styles.statBoxContent}>
                            <Text style={styles.statValue}>{events.length}</Text>
                            <Text style={styles.statLabel}>Events</Text>
                        </GlassCard>
                        <GlassCard tier={1} style={styles.statBox} contentStyle={styles.statBoxContent}>
                            <Text style={[styles.statValue, { color: theme.colors.danger }]}>
                                {severityCounts['HIGH'] || 0}
                            </Text>
                            <Text style={styles.statLabel}>High</Text>
                        </GlassCard>
                        <GlassCard tier={1} style={styles.statBox} contentStyle={styles.statBoxContent}>
                            <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                                {severityCounts['MEDIUM'] || 0}
                            </Text>
                            <Text style={styles.statLabel}>Medium</Text>
                        </GlassCard>
                        <GlassCard tier={1} style={styles.statBox} contentStyle={styles.statBoxContent}>
                            <Text style={[styles.statValue, { color: theme.colors.safe }]}>
                                {severityCounts['LOW'] || 0}
                            </Text>
                            <Text style={styles.statLabel}>Low</Text>
                        </GlassCard>
                    </View>
                </AnimatedEntry>

                {/* ═══ Event Timeline ═══ */}
                <AnimatedEntry delay={200} type="fade-up">
                    <GlassCard tier={1} style={styles.timelineCard}>
                        <SectionLabel text="Event Timeline" dotColor={SECTION_DOT_COLORS.ember} />

                        {events.length === 0 ? (
                            <View style={styles.emptyTimeline}>
                                <Ionicons name="checkmark-circle-outline" size={36} color={theme.colors.safe} />
                                <Text style={styles.emptyTimelineText}>No events — clean trip!</Text>
                            </View>
                        ) : (
                            events.map((event, index) => {
                                const sev = severityColors[event.severity as keyof typeof severityColors] || severityColors.MEDIUM;
                                const isHigh = event.severity === 'HIGH';
                                const isLast = index === events.length - 1;

                                return (
                                    <AnimatedEntry key={event.id ?? index} delay={250 + index * 60} type="slide-left">
                                        <PressableScale
                                            scaleTo={0.97}
                                            onPress={() => { Haptics.selectionAsync(); setSelectedEvent(event); }}
                                        >
                                            <View style={styles.timelineRow}>
                                                {/* Timeline connector */}
                                                <View style={styles.timelineConnector}>
                                                    {isHigh ? (
                                                        <PulseDot active={true} color={sev.color} size={10} />
                                                    ) : (
                                                        <View style={[styles.timelineDot, { backgroundColor: sev.color }]} />
                                                    )}
                                                    {!isLast && <View style={styles.timelineLine} />}
                                                </View>

                                                {/* Content */}
                                                <View
                                                    style={[
                                                        styles.timelineContent,
                                                        isHigh && {
                                                            borderLeftWidth: 3,
                                                            borderLeftColor: theme.colors.danger,
                                                            backgroundColor: theme.colors.dangerBg,
                                                            borderRadius: theme.radius.sm,
                                                            paddingLeft: theme.spacing.md,
                                                        },
                                                    ]}
                                                >
                                                    <View style={styles.timelineHeader}>
                                                        <View style={[styles.severityBadge, { backgroundColor: sev.bg }]}>
                                                            <Text style={[styles.severityText, { color: sev.color }]}>
                                                                {event.severity}
                                                            </Text>
                                                        </View>
                                                        <Text style={styles.timelineTime}>
                                                            {formatTime(event.timestamp)}
                                                        </Text>
                                                    </View>

                                                    <Text style={styles.timelineType}>
                                                        {eventTypeLabels[event.event_type] || event.event_type}
                                                    </Text>

                                                    {event.speed != null && (
                                                        <Text style={styles.timelineSpeed}>
                                                            {Math.round(event.speed)} km/h
                                                        </Text>
                                                    )}

                                                    {event.location?.address && (
                                                        <Text style={styles.timelineLocation} numberOfLines={1}>
                                                            {event.location.address}
                                                        </Text>
                                                    )}
                                                </View>
                                            </View>
                                        </PressableScale>
                                    </AnimatedEntry>
                                );
                            })
                        )}
                    </GlassCard>
                </AnimatedEntry>

                <View style={{ height: 100 }} />
            </ScrollView>

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
                                const sev = severityColors[selectedEvent.severity as keyof typeof severityColors] || severityColors.MEDIUM;
                                return (
                                    <>
                                        <View style={[styles.eventDetailBadge, { backgroundColor: sev.bg }]}>
                                            <Ionicons
                                                name={
                                                    selectedEvent.severity === 'HIGH'
                                                        ? 'alert-circle'
                                                        : selectedEvent.severity === 'MEDIUM'
                                                            ? 'warning'
                                                            : 'information-circle'
                                                }
                                                size={24}
                                                color={sev.color}
                                            />
                                            <Text style={[styles.eventDetailSeverity, { color: sev.color }]}>
                                                {selectedEvent.severity}
                                            </Text>
                                        </View>

                                        <Text style={styles.eventDetailType}>
                                            {eventTypeLabels[selectedEvent.event_type] || selectedEvent.event_type}
                                        </Text>

                                        <View style={styles.eventDetailGrid}>
                                            {selectedEvent.speed != null && (
                                                <View style={styles.eventDetailItem}>
                                                    <Ionicons name="speedometer-outline" size={16} color={theme.colors.textTertiary} />
                                                    <Text style={styles.eventDetailLabel}>
                                                        {Math.round(selectedEvent.speed)} km/h
                                                    </Text>
                                                </View>
                                            )}
                                            <View style={styles.eventDetailItem}>
                                                <Ionicons name="time-outline" size={16} color={theme.colors.textTertiary} />
                                                <Text style={styles.eventDetailLabel}>
                                                    {formatDateTime(selectedEvent.timestamp)}
                                                </Text>
                                            </View>
                                            {selectedEvent.location?.lat != null && selectedEvent.location?.lng != null && (
                                                <View style={styles.eventDetailItem}>
                                                    <Ionicons name="location-outline" size={16} color={theme.colors.textTertiary} />
                                                    <Text style={styles.eventDetailLabel}>
                                                        {selectedEvent.location.address
                                                            || `${selectedEvent.location.lat.toFixed(4)}, ${selectedEvent.location.lng.toFixed(4)}`}
                                                    </Text>
                                                </View>
                                            )}
                                            {selectedEvent.bus_registration && (
                                                <View style={styles.eventDetailItem}>
                                                    <Ionicons name="bus-outline" size={16} color={theme.colors.textTertiary} />
                                                    <Text style={styles.eventDetailLabel}>
                                                        {selectedEvent.bus_registration}
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

// ─── Styles ──────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.base,
    },

    // Loading / Error
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
    loadingText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.body,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.md,
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
    errorActions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
        marginTop: theme.spacing.base,
    },

    // Back button
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.lg,
        alignSelf: 'flex-start',
    },
    backLabel: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textSecondary,
    },

    // Summary card
    summaryCard: {
        paddingVertical: theme.spacing['2xl'],
        marginBottom: theme.spacing.xl,
        // More opaque than default tier-0 glass — improves readability over vivid background
        backgroundColor: 'rgba(228,220,255,0.82)',
    },
    summaryCardContent: {
        alignItems: 'center',
    },
    scoreLabel: {
        fontFamily: theme.fonts.display,
        fontSize: theme.fontSize.title2,
        fontWeight: theme.fontWeight.display,
        marginTop: theme.spacing.md,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xl,
        marginTop: theme.spacing.lg,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    metaText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
    },
    busChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        backgroundColor: theme.colors.infoBg,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.full,
        marginTop: theme.spacing.base,
    },
    busChipText: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.info,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: theme.spacing.base,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.safe,
    },
    activeText: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.safe,
    },

    // Stats 2×2 grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl,
    },
    statBox: {
        // Two per row with gap accounted for
        width: '47.5%',
        paddingVertical: theme.spacing.lg,
    },
    statBoxContent: {
        alignItems: 'center',
    },
    statValue: {
        fontFamily: theme.fonts.display,
        fontSize: theme.fontSize.title2,
        fontWeight: theme.fontWeight.display,
        color: theme.colors.textPrimary,
    },
    statLabel: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.xs,
    },

    // Section
    sectionTitle: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.base,
    },

    // Timeline
    timelineCard: { marginBottom: theme.spacing.xl },
    emptyTimeline: {
        alignItems: 'center',
        paddingVertical: theme.spacing['2xl'],
        gap: theme.spacing.md,
    },
    emptyTimelineText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        color: theme.colors.textTertiary,
    },
    timelineRow: {
        flexDirection: 'row',
        minHeight: 72,
    },
    timelineConnector: {
        width: 24,
        alignItems: 'center',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginTop: 4,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        backgroundColor: theme.colors.divider,
        marginVertical: 4,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: theme.spacing.base,
        paddingLeft: theme.spacing.sm,
    },
    timelineHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    timelineTime: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
        fontVariant: ['tabular-nums'],
    },
    timelineType: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
    },
    timelineSpeed: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        color: theme.colors.textTertiary,
        marginTop: 2,
    },
    timelineLocation: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        color: theme.colors.textQuaternary,
        marginTop: 2,
    },

    // Shared severity badge
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

    // Event detail modal
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.modalOverlay,
        justifyContent: 'flex-end',
    },
    modalContent: {
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: theme.spacing['3xl'],
    },
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
        flex: 1,
    },
});
