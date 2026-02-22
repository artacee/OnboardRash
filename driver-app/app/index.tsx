/**
 * Welcome / Onboarding Screen — Premium hero animation.
 * 
 * Features:
 * - Spring-bounce logo entrance
 * - Staggered title & subtitle fade-up
 * - Sequential feature list reveal
 * - CTA button bounces in last
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
    FadeInDown,
    FadeInUp,
    BounceIn,
    ZoomIn,
} from 'react-native-reanimated';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* ═══ Hero Area ═══ */}
                <View style={styles.heroSection}>
                    {/* App Icon — Spring bounce entrance */}
                    <Animated.View entering={ZoomIn.delay(100).springify().damping(12).stiffness(150)}>
                        <GlassCard tier={0} style={styles.iconCard}>
                            <View style={styles.iconInner}>
                                <Ionicons name="bus" size={48} color={theme.colors.textPrimary} />
                            </View>
                        </GlassCard>
                    </Animated.View>

                    {/* Title — Fade up after logo */}
                    <Animated.Text
                        entering={FadeInDown.delay(300).duration(600).springify().damping(18)}
                        style={styles.title}
                    >
                        OnboardRash
                    </Animated.Text>

                    <Animated.Text
                        entering={FadeInDown.delay(450).duration(600).springify().damping(18)}
                        style={styles.subtitle}
                    >
                        Driver Companion
                    </Animated.Text>

                    <Animated.Text
                        entering={FadeInDown.delay(600).duration(600).springify().damping(18)}
                        style={styles.tagline}
                    >
                        Drive Safer. Drive Smarter.
                    </Animated.Text>
                </View>

                {/* ═══ Features Preview — Staggered reveal ═══ */}
                <AnimatedEntry delay={700}>
                    <GlassCard tier={1} style={styles.featuresCard}>
                        {[
                            { icon: 'navigate', color: theme.colors.safe, text: 'Real-time GPS tracking', delay: 750 },
                            { icon: 'shield-checkmark', color: theme.colors.info, text: 'Live driving behavior score', delay: 850 },
                            { icon: 'analytics', color: theme.colors.warning, text: 'Trip history & analytics', delay: 950 },
                        ].map((feature, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInDown.delay(feature.delay).duration(500).springify().damping(18)}
                                style={styles.featureRow}
                            >
                                <View style={[styles.featureIconBg, { backgroundColor: `${feature.color}15` }]}>
                                    <Ionicons name={feature.icon as any} size={18} color={feature.color} />
                                </View>
                                <Text style={styles.featureText}>{feature.text}</Text>
                            </Animated.View>
                        ))}
                    </GlassCard>
                </AnimatedEntry>

                {/* ═══ CTA — Bounces in last ═══ */}
                <Animated.View
                    entering={FadeInUp.delay(1050).duration(600).springify().damping(14).stiffness(120)}
                    style={styles.ctaSection}
                >
                    <GlassButton
                        title="Get Started"
                        variant="primary"
                        onPress={() => router.push('/login')}
                        icon={<Ionicons name="arrow-forward" size={18} color="#047857" />}
                        style={styles.ctaButton}
                    />
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    featureIconBg: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.callout,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textSecondary,
        flex: 1,
    },
    ctaSection: {
        alignItems: 'center',
    },
    ctaButton: {
        minWidth: 220,
    },
});
