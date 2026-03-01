/**
 * Profile Screen — Premium with rotating gradient avatar ring,
 * staggered animations, and haptic feedback.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    RefreshControl,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { PressableScale } from '@/components/ui/PressableScale';
import { ProfileSkeleton } from '@/components/ui/ShimmerPlaceholder';
import { Background } from '@/components/ui/Background';
import { GradientTitle, GRADIENT_PRESETS } from '@/components/ui/GradientTitle';
import { SectionLabel, SECTION_DOT_COLORS } from '@/components/ui/SectionLabel';
import { theme } from '@/constants/theme';
import * as api from '@/services/api';
import { setPiUrl, getPiUrl, persistPiUrl } from '@/services/gpsStreamer';

// ═══ Rotating Gradient Avatar Ring ═══

function AvatarRing({ children }: { children: React.ReactNode }) {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 6000, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }));

    return (
        <View style={avatarStyles.container}>
            <Animated.View style={[avatarStyles.gradientRing, ringStyle]}>
                <LinearGradient
                    colors={['#e2c8ff', '#9452e8', '#c43070', '#7028b8', '#e2c8ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
            <View style={avatarStyles.inner}>{children}</View>
        </View>
    );
}

const avatarStyles = StyleSheet.create({
    container: {
        width: 90,
        height: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradientRing: {
        position: 'absolute',
        width: 90,
        height: 90,
        borderRadius: 45,
        overflow: 'hidden',
    },
    inner: {
        width: 74,
        height: 74,
        borderRadius: 37,
        backgroundColor: theme.colors.bgBase,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.bgBase,
    },
});

// ═══ Main Profile Screen ═══

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [piAddress, setPiAddress] = useState(getPiUrl());
    const [serverUrl, setServerUrl] = useState(api.getApiUrl());

    const fetchProfile = useCallback(async () => {
        try {
            const data = await api.getProfile();
            setProfile(data);
            setFetchError(null);
        } catch (err: any) {
            setFetchError(err.message || 'Failed to load profile');
        } finally {
            setInitialLoading(false);
        }
    }, []);

    useEffect(() => { fetchProfile(); }, []);

    const onRefresh = async () => {
        Haptics.selectionAsync();
        setRefreshing(true);
        await fetchProfile();
        setRefreshing(false);
    };

    const handleLogout = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    await api.logout();
                    router.replace('/');
                },
            },
        ]);
    };

    const handleSaveSettings = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Persist to SecureStore so settings survive app restarts
        await persistPiUrl(piAddress);
        await api.persistApiUrl(serverUrl);
        Alert.alert('Settings Saved', 'Connection settings updated and persisted.');
    };

    const driver = profile?.driver;
    const stats = profile?.stats;

    // ─── Hidden admin triple-tap on version text ─────────
    const tapCountRef = useRef(0);
    const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleVersionTap = () => {
        tapCountRef.current += 1;
        if (tapCountRef.current >= 3) {
            tapCountRef.current = 0;
            if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.push('/admin');
            return;
        }
        if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
        tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 800);
    };

    // Loading state
    if (initialLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <Background variant="portrait" />
                <View style={styles.scrollContent}>
                    <ProfileSkeleton />
                </View>
            </SafeAreaView>
        );
    }

    // Error state (when no profile loaded)
    if (fetchError && !profile) {
        return (
            <SafeAreaView style={styles.container}>
                <Background variant="portrait" />
                <View style={styles.errorContainer}>
                    <GlassCard tier={1} style={styles.errorCard}>
                        <Ionicons name="cloud-offline-outline" size={48} color={theme.colors.danger} />
                        <Text style={styles.errorTitle}>Connection Error</Text>
                        <Text style={styles.errorSubtext}>{fetchError}</Text>
                        <GlassButton
                            title="Retry"
                            onPress={() => { setInitialLoading(true); fetchProfile(); }}
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
            <Background variant="portrait" />
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
                        <GradientTitle text="Profile" colors={GRADIENT_PRESETS.profile} fontSize={theme.fontSize.title1} />
                    </View>
                </AnimatedEntry>

                {/* Driver Info Card */}
                <AnimatedEntry delay={100} type="scale">
                    <GlassCard tier={0} style={styles.profileCard}>
                        <AvatarRing>
                            <Ionicons name="person" size={32} color={theme.colors.textTertiary} />
                        </AvatarRing>

                        <Text style={styles.driverName}>
                            {driver?.full_name || 'Driver'}
                        </Text>
                        <Text style={styles.driverUsername}>
                            @{driver?.username || 'username'}
                        </Text>

                        <View style={styles.detailsGrid}>
                            {driver?.phone_number && (
                                <PressableScale scaleTo={0.98}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="call-outline" size={16} color={theme.colors.textTertiary} />
                                        <Text style={styles.detailText}>{driver.phone_number}</Text>
                                    </View>
                                </PressableScale>
                            )}
                            {driver?.license_number && (
                                <PressableScale scaleTo={0.98}>
                                    <View style={styles.detailRow}>
                                        <Ionicons name="card-outline" size={16} color={theme.colors.textTertiary} />
                                        <Text style={styles.detailText}>{driver.license_number}</Text>
                                    </View>
                                </PressableScale>
                            )}
                        </View>
                    </GlassCard>
                </AnimatedEntry>

                {/* Stats Card — 2×2 grid */}
                <AnimatedEntry delay={200} type="fade-up">
                    <GlassCard tier={1} style={styles.statsCard}>
                        <SectionLabel text="Driving Stats" dotColor={SECTION_DOT_COLORS.profile} />
                        <View style={styles.statsGrid}>
                            {/* Row 1 */}
                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{stats?.total_trips || 0}</Text>
                                    <Text style={styles.statLabel}>Trips</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <Text style={[styles.statValue, {
                                        color: (stats?.avg_score || 100) >= 80 ? theme.colors.safe :
                                            (stats?.avg_score || 100) >= 50 ? theme.colors.warning :
                                                theme.colors.danger
                                    }]}>
                                        {Math.round(stats?.avg_score || 100)}
                                    </Text>
                                    <Text style={styles.statLabel}>Avg Score</Text>
                                </View>
                            </View>

                            {/* Horizontal divider */}
                            <View style={styles.statDividerHorizontal} />

                            {/* Row 2 */}
                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statValue}>{stats?.total_events || 0}</Text>
                                    <Text style={styles.statLabel}>Events</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <Text style={[styles.statValue, {
                                        color: (stats?.best_score || 100) >= 80 ? theme.colors.safe :
                                            (stats?.best_score || 100) >= 50 ? theme.colors.warning :
                                                theme.colors.danger
                                    }]}>
                                        {Math.round(stats?.best_score || 100)}
                                    </Text>
                                    <Text style={styles.statLabel}>Best Score</Text>
                                </View>
                            </View>
                        </View>
                    </GlassCard>
                </AnimatedEntry>

                {/* Connection Settings */}
                <AnimatedEntry delay={300} type="fade-up">
                    <GlassCard tier={1} style={styles.settingsCard}>
                        <SectionLabel text="Connection Settings" dotColor={SECTION_DOT_COLORS.profile} />
                        <GlassInput
                            label="Pi Address"
                            placeholder="http://192.168.43.100:8081"
                            value={piAddress}
                            onChangeText={setPiAddress}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <GlassInput
                            label="Backend Server"
                            placeholder="http://192.168.43.2:5000"
                            value={serverUrl}
                            onChangeText={setServerUrl}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <GlassButton
                            title="Save Settings"
                            onPress={handleSaveSettings}
                            style={styles.saveButton}
                        />
                    </GlassCard>
                </AnimatedEntry>

                {/* Logout */}
                <AnimatedEntry delay={400} type="fade-up">
                    <View style={styles.logoutSection}>
                        <GlassButton
                            title="Logout"
                            variant="danger"
                            onPress={handleLogout}
                            icon={<Ionicons name="log-out-outline" size={18} color={theme.colors.dangerText} />}
                        />
                    </View>
                </AnimatedEntry>

                <Pressable onPress={handleVersionTap}>
                    <Text style={styles.version}>OnboardRash Driver v1.0.0</Text>
                </Pressable>
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
    errorSubtext: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        color: theme.colors.textTertiary,
        textAlign: 'center',
    },
    header: { marginBottom: theme.spacing.xl },
    title: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.title1,
        fontWeight: theme.fontWeight.title,
        color: theme.colors.textPrimary,
        letterSpacing: -0.5,
    },
    profileCard: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        paddingVertical: theme.spacing['2xl'],
    },
    driverName: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.title2,
        fontWeight: theme.fontWeight.title,
        color: theme.colors.textPrimary,
        marginTop: theme.spacing.base,
    },
    driverUsername: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.xs,
    },
    detailsGrid: {
        marginTop: theme.spacing.base,
        gap: theme.spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    detailText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textSecondary,
    },
    statsCard: { marginBottom: theme.spacing.xl },
    sectionTitle: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: theme.spacing.base,
    },
    statsGrid: {
        gap: 0,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: theme.colors.divider,
    },
    statDividerHorizontal: {
        height: 1,
        backgroundColor: theme.colors.divider,
        marginHorizontal: theme.spacing.base,
    },
    statValue: {
        fontFamily: theme.fonts.display,
        fontSize: theme.fontSize.title1,
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
    settingsCard: { marginBottom: theme.spacing.xl },
    saveButton: { marginTop: theme.spacing.sm },
    logoutSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    version: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textQuaternary,
        textAlign: 'center',
        marginBottom: theme.spacing.base,
    },
});
