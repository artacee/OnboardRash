/**
 * History Screen — Trip history with staggered animations, haptics, and trip detail navigation.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { Background } from '@/components/ui/Background';
import { GradientTitle, GRADIENT_PRESETS } from '@/components/ui/GradientTitle';
import { PressableScale } from '@/components/ui/PressableScale';
import { HistorySkeleton } from '@/components/ui/ShimmerPlaceholder';
import { theme } from '@/constants/theme';
import * as api from '@/services/api';
import type { Trip } from '@/types';

export default function HistoryScreen() {
    const router = useRouter();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const fetchTrips = useCallback(async () => {
        try {
            const data = await api.getTrips();
            setTrips(data.trips || []);
            setFetchError(null);
        } catch (err: any) {
            setFetchError(err.message || 'Failed to load trips');
        } finally {
            setInitialLoading(false);
        }
    }, []);

    useEffect(() => { fetchTrips(); }, []);

    const onRefresh = async () => {
        Haptics.selectionAsync();
        setRefreshing(true);
        await fetchTrips();
        setRefreshing(false);
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return theme.colors.safe;
        if (score >= 50) return theme.colors.warning;
        return theme.colors.danger;
    };

    const formatDuration = (start: string, end: string | null) => {
        if (!end) return 'In Progress';
        const ms = new Date(end).getTime() - new Date(start).getTime();
        const mins = Math.floor(ms / 60000);
        const hours = Math.floor(mins / 60);
        if (hours > 0) return `${hours}h ${mins % 60}m`;
        return `${mins}m`;
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Group trips by date
    const groupedTrips = useMemo(() => {
        const groups: { label: string; trips: Trip[] }[] = [];
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const isSameDay = (a: Date, b: Date) =>
            a.getFullYear() === b.getFullYear() &&
            a.getMonth() === b.getMonth() &&
            a.getDate() === b.getDate();

        let currentLabel = '';
        trips.forEach((trip) => {
            const tripDate = new Date(trip.started_at);
            let label: string;
            if (isSameDay(tripDate, today)) label = 'Today';
            else if (isSameDay(tripDate, yesterday)) label = 'Yesterday';
            else label = formatDate(trip.started_at);

            if (label !== currentLabel) {
                currentLabel = label;
                groups.push({ label, trips: [trip] });
            } else {
                groups[groups.length - 1].trips.push(trip);
            }
        });
        return groups;
    }, [trips]);

    return (
        <SafeAreaView style={styles.container}>
            <Background variant="dusk" />
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
                        <GradientTitle text="Trip History" colors={GRADIENT_PRESETS.history} fontSize={theme.fontSize.title1} />
                        <Text style={styles.subtitle}>{trips.length} trips recorded</Text>
                    </View>
                </AnimatedEntry>

                {/* Loading State */}
                {initialLoading && <HistorySkeleton />}

                {/* Error State */}
                {fetchError && !initialLoading && trips.length === 0 && (
                    <AnimatedEntry delay={100}>
                        <GlassCard tier={1} style={styles.errorCard}>
                            <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.danger} />
                            <Text style={styles.errorTitle}>Failed to load trips</Text>
                            <Text style={styles.errorSubtext}>{fetchError}</Text>
                            <GlassButton
                                title="Retry"
                                onPress={() => { setInitialLoading(true); fetchTrips(); }}
                                variant="primary"
                                style={{ marginTop: theme.spacing.base }}
                            />
                        </GlassCard>
                    </AnimatedEntry>
                )}

                {/* Empty State */}
                {!initialLoading && !fetchError && trips.length === 0 && (
                    <AnimatedEntry delay={100}>
                        <GlassCard tier={1} style={styles.emptyCard}>
                            <Ionicons name="time-outline" size={48} color={theme.colors.textQuaternary} />
                            <Text style={styles.emptyText}>No trips yet</Text>
                            <Text style={styles.emptySubtext}>
                                Start your first trip from the Home tab
                            </Text>
                        </GlassCard>
                    </AnimatedEntry>
                )}

                {/* Trip List — grouped by date */}
                {!initialLoading && trips.length > 0 &&
                    groupedTrips.map((group, groupIndex) => (
                        <View key={group.label}>
                            {/* Date section header */}
                            <AnimatedEntry delay={80 + groupIndex * 60} type="fade">
                                <Text style={styles.dateHeader}>{group.label}</Text>
                            </AnimatedEntry>

                            {group.trips.map((trip, index) => {
                                const scoreColor = getScoreColor(trip.score);
                                return (
                                    <AnimatedEntry key={trip.id} delay={120 + groupIndex * 60 + index * 80} type="slide-left">
                                        <PressableScale
                                            onPress={() => {
                                                router.push(`/trip/${trip.id}` as any);
                                            }}
                                            scaleTo={0.97}
                                        >
                                            <GlassCard tier={1} style={styles.tripCard}>
                                                {/* Top row */}
                                                <View style={styles.tripHeader}>
                                                    <View style={styles.tripInfo}>
                                                        <Text style={styles.tripDate}>
                                                            {formatTime(trip.started_at)}
                                                            {trip.ended_at ? ` — ${formatTime(trip.ended_at)}` : ''}
                                                        </Text>
                                                    </View>

                                                    {/* Score mini ring */}
                                                    <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
                                                        <Text style={[styles.scoreBadgeText, { color: scoreColor }]}>
                                                            {Math.round(trip.score)}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Stats row */}
                                                <View style={styles.tripStats}>
                                                    <View style={styles.statItem}>
                                                        <Ionicons name="bus-outline" size={14} color={theme.colors.textTertiary} />
                                                        <Text style={styles.statText}>
                                                            {trip.bus_registration || 'N/A'}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.statItem}>
                                                        <Ionicons name="timer-outline" size={14} color={theme.colors.textTertiary} />
                                                        <Text style={styles.statText}>
                                                            {formatDuration(trip.started_at, trip.ended_at)}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.statItem}>
                                                        <Ionicons name="warning-outline" size={14} color={theme.colors.textTertiary} />
                                                        <Text style={styles.statText}>
                                                            {trip.event_count} events
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Active badge */}
                                                {trip.is_active && (
                                                    <Animated.View
                                                        entering={FadeIn.duration(300)}
                                                        style={styles.activeBadge}
                                                    >
                                                        <View style={styles.activeDot} />
                                                        <Text style={styles.activeText}>Active</Text>
                                                    </Animated.View>
                                                )}
                                            </GlassCard>
                                        </PressableScale>
                                    </AnimatedEntry>
                                );
                            })}
                        </View>
                    ))
                }

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
    title: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.title1,
        fontWeight: theme.fontWeight.title,
        color: theme.colors.textPrimary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.body,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    dateHeader: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    errorCard: {
        alignItems: 'center',
        paddingVertical: theme.spacing['3xl'],
        gap: theme.spacing.md,
    },
    errorTitle: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.title3,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
    },
    errorSubtext: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        color: theme.colors.textTertiary,
        textAlign: 'center',
    },
    emptyCard: {
        alignItems: 'center',
        paddingVertical: theme.spacing['3xl'],
        gap: theme.spacing.md,
    },
    emptyText: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.title3,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textTertiary,
    },
    emptySubtext: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textQuaternary,
    },
    tripCard: { marginBottom: theme.spacing.md },
    tripHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    tripInfo: {},
    tripDate: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textPrimary,
    },
    scoreBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.glassTier2,
    },
    scoreBadgeText: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.title,
    },
    tripStats: {
        flexDirection: 'row',
        gap: theme.spacing.base,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    statText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
    },
    activeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        backgroundColor: theme.colors.safeBg,
        borderRadius: theme.radius.full,
        alignSelf: 'flex-start',
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: theme.colors.safe,
    },
    activeText: {
        fontFamily: theme.fonts.headline,
        fontSize: 10,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.safe,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});
