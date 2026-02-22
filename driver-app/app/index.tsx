/**
 * Welcome / Onboarding Screen
 * 
 * visionOS-inspired landing with animated logo area, tagline,
 * and a "Get Started" glass button.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Hero Area */}
                <View style={styles.heroSection}>
                    {/* App Icon */}
                    <GlassCard tier={0} style={styles.iconCard}>
                        <View style={styles.iconInner}>
                            <Ionicons name="bus" size={48} color={theme.colors.textPrimary} />
                        </View>
                    </GlassCard>

                    {/* Title */}
                    <Text style={styles.title}>OnboardRash</Text>
                    <Text style={styles.subtitle}>Driver Companion</Text>

                    {/* Tagline */}
                    <Text style={styles.tagline}>
                        Drive Safer. Drive Smarter.
                    </Text>
                </View>

                {/* Features Preview */}
                <GlassCard tier={1} style={styles.featuresCard}>
                    <View style={styles.featureRow}>
                        <Ionicons name="navigate" size={20} color={theme.colors.safe} />
                        <Text style={styles.featureText}>Real-time GPS tracking</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Ionicons name="shield-checkmark" size={20} color={theme.colors.info} />
                        <Text style={styles.featureText}>Live driving behavior score</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Ionicons name="analytics" size={20} color={theme.colors.warning} />
                        <Text style={styles.featureText}>Trip history & analytics</Text>
                    </View>
                </GlassCard>

                {/* CTA */}
                <View style={styles.ctaSection}>
                    <GlassButton
                        title="Get Started"
                        variant="primary"
                        onPress={() => router.push('/login')}
                        icon={<Ionicons name="arrow-forward" size={18} color="#047857" />}
                        style={styles.ctaButton}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.xl,
        justifyContent: 'center',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: theme.spacing['3xl'],
    },
    iconCard: {
        width: 100,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.xl,
    },
    iconInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: theme.fonts.display,
        fontSize: theme.fontSize.display2,
        fontWeight: theme.fontWeight.display,
        color: theme.colors.textPrimary,
        letterSpacing: -1,
    },
    subtitle: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.title2,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    tagline: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.body,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
        marginTop: theme.spacing.md,
    },
    featuresCard: {
        marginBottom: theme.spacing['2xl'],
        gap: theme.spacing.base,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    featureText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textSecondary,
    },
    ctaSection: {
        alignItems: 'center',
    },
    ctaButton: {
        minWidth: 200,
    },
});
