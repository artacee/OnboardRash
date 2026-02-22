/**
 * Profile Screen — Driver profile, stats, Pi settings, logout.
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
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { theme } from '@/constants/theme';
import * as api from '@/services/api';
import { setPiUrl, getPiUrl } from '@/services/gpsStreamer';

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
        } catch {
            // Silent fail
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchProfile();
        setRefreshing(false);
    };

    const handleLogout = () => {
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
                <View style={styles.header}>
                    <Text style={styles.title}>Profile</Text>
                </View>

                {/* Driver Info Card */}
                <GlassCard tier={0} style={styles.profileCard}>
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={36} color={theme.colors.textTertiary} />
                        </View>
                    </View>

                    <Text style={styles.driverName}>
                        {driver?.full_name || 'Driver'}
                    </Text>
                    <Text style={styles.driverUsername}>
                        @{driver?.username || 'username'}
                    </Text>

                    {/* Details */}
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

                {/* Stats Card */}
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

                {/* Connection Settings */}
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
                        placeholder="http://192.168.1.100:5000"
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

                {/* Logout */}
                <GlassButton
                    title="Logout"
                    variant="danger"
                    onPress={handleLogout}
                    icon={<Ionicons name="log-out-outline" size={18} color="#b91c1c" />}
                    style={styles.logoutButton}
                />

                {/* App version */}
                <Text style={styles.version}>OnboardRash Driver v1.0.0</Text>

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
    profileCard: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
        paddingVertical: theme.spacing['2xl'],
    },
    avatarContainer: {
        marginBottom: theme.spacing.base,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.colors.glassTier2,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    driverName: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.title2,
        fontWeight: theme.fontWeight.title,
        color: theme.colors.textPrimary,
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
    statsCard: {
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
    settingsCard: {
        marginBottom: theme.spacing.xl,
    },
    saveButton: {
        marginTop: theme.spacing.sm,
    },
    logoutButton: {
        alignSelf: 'center',
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
