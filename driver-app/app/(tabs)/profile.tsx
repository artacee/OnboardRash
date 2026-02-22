/**
 * Profile Screen — Premium with rotating gradient avatar ring,
 * staggered animations, and haptic feedback.
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
import { theme } from '@/constants/theme';
import * as api from '@/services/api';
import { setPiUrl, getPiUrl } from '@/services/gpsStreamer';

// ═══ Rotating Gradient Avatar Ring ═══

function AvatarRing({ children }: { children: React.ReactNode }) {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, { duration: 4000, easing: Easing.linear }),
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
                    colors={['#7850dc', '#ff78aa', '#3cbeff', '#ffc850', '#7850dc']}
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
        width: 84,
        height: 84,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradientRing: {
        position: 'absolute',
        width: 84,
        height: 84,
        borderRadius: 42,
        overflow: 'hidden',
    },
    inner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.colors.bgBase,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: theme.colors.bgBase,
    },
});

// ═══ Main Profile Screen ═══

export default function ProfileScreen() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [piAddress, setPiAddress] = useState(getPiUrl());
    const [serverUrl, setServerUrl] = useState(api.getApiUrl());

    const fetchProfile = useCallback(async () => {
        try {
            const data = await api.getProfile();
            setProfile(data);
        } catch { }
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

    const handleSaveSettings = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPiUrl(piAddress);
        api.setApiUrl(serverUrl);
        Alert.alert('Settings Saved', 'Connection settings updated.');
    };

    const driver = profile?.driver;
    const stats = profile?.stats;

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
                        <Text style={styles.title}>Profile</Text>
                    </View>
                </AnimatedEntry>

                {/* Driver Info Card */}
                <AnimatedEntry delay={100}>
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
                                <View style={styles.detailRow}>
                                    <Ionicons name="call-outline" size={16} color={theme.colors.textTertiary} />
                                    <Text style={styles.detailText}>{driver.phone_number}</Text>
                                </View>
                            )}
                            {driver?.license_number && (
                                <View style={styles.detailRow}>
                                    <Ionicons name="card-outline" size={16} color={theme.colors.textTertiary} />
                                    <Text style={styles.detailText}>{driver.license_number}</Text>
                                </View>
                            )}
                        </View>
                    </GlassCard>
                </AnimatedEntry>

                {/* Stats Card */}
                <AnimatedEntry delay={200}>
                    <GlassCard tier={1} style={styles.statsCard}>
                        <Text style={styles.sectionTitle}>Driving Stats</Text>
                        <View style={styles.statsGrid}>
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
                    </GlassCard>
                </AnimatedEntry>

                {/* Connection Settings */}
                <AnimatedEntry delay={300}>
                    <GlassCard tier={1} style={styles.settingsCard}>
                        <Text style={styles.sectionTitle}>Connection Settings</Text>
                        <GlassInput
                            label="Pi Address"
                            placeholder="http://192.168.43.1:8081"
                            value={piAddress}
                            onChangeText={setPiAddress}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <GlassInput
                            label="Backend Server"
                            placeholder="http://192.168.1.40:5000"
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
                <AnimatedEntry delay={400}>
                    <View style={styles.logoutSection}>
                        <GlassButton
                            title="Logout"
                            variant="danger"
                            onPress={handleLogout}
                            icon={<Ionicons name="log-out-outline" size={18} color="#b91c1c" />}
                        />
                    </View>
                </AnimatedEntry>

                <Text style={styles.version}>OnboardRash Driver v1.0.0</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
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
