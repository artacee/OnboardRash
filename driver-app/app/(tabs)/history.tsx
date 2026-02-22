/**
 * History Screen — Trip history with scores and event counts.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { theme } from '@/constants/theme';
import * as api from '@/services/api';

export default function HistoryScreen() {
    const [trips, setTrips] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [expandedTrip, setExpandedTrip] = useState<number | null>(null);

    const fetchTrips = useCallback(async () => {
        try {
            const data = await api.getTrips();
            setTrips(data.trips || []);
        } catch (err) {
            // Silent fail
        }
    }, []);

    useEffect(() => {
        fetchTrips();
    }, []);

    const onRefresh = async () => {
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
                    <Text style={styles.title}>Trip History</Text>
                    <Text style={styles.subtitle}>{trips.length} trips recorded</Text>
                </View>

                {/* Trip List */}
                {trips.length === 0 ? (
                    <GlassCard tier={1} style={styles.emptyCard}>
                        <Ionicons name="time-outline" size={48} color={theme.colors.textQuaternary} />
                        <Text style={styles.emptyText}>No trips yet</Text>
                        <Text style={styles.emptySubtext}>
                            Start your first trip from the Home tab
                        </Text>
                    </GlassCard>
                ) : (
                    trips.map((trip) => {
                        const scoreColor = getScoreColor(trip.score);
                        const isExpanded = expandedTrip === trip.id;

                        return (
                            <TouchableOpacity
                                key={trip.id}
                                onPress={() => setExpandedTrip(isExpanded ? null : trip.id)}
                                activeOpacity={0.7}
                            >
                                <GlassCard tier={1} style={styles.tripCard}>
                                    {/* Top row */}
                                    <View style={styles.tripHeader}>
                                        <View style={styles.tripInfo}>
                                            <Text style={styles.tripDate}>
                                                {formatDate(trip.started_at)}
                                            </Text>
                                            <Text style={styles.tripTime}>
                                                {formatTime(trip.started_at)}
                                                {trip.ended_at ? ` — ${formatTime(trip.ended_at)}` : ''}
                                            </Text>
                                        </View>
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
                                        <View style={styles.activeBadge}>
                                            <View style={styles.activeDot} />
                                            <Text style={styles.activeText}>Active</Text>
                                        </View>
                                    )}
                                </GlassCard>
                            </TouchableOpacity>
                        );
                    })
                )}

                {/* Bottom spacer */}
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
    tripCard: {
        marginBottom: theme.spacing.md,
    },
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
    tripTime: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
        marginTop: 2,
    },
    scoreBadge: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
