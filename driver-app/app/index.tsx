/**
 * Welcome / Onboarding Screen — Premium hero animation.
 *
 * Features:
 * - 3D floating bus icon: layered depth cards + LinearGradient + specular + speed lines
 * - Levitation loop with responsive ground shadow
 * - Staggered title & subtitle fade-up
 * - Sequential feature list reveal
 * - CTA button bounces in last
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInDown,
    FadeInUp,
    ZoomIn,
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { AnimatedEntry } from '@/components/ui/AnimatedEntry';
import { PressableScale } from '@/components/ui/PressableScale';
import { Background } from '@/components/ui/Background';
import { GradientTitle, GRADIENT_PRESETS } from '@/components/ui/GradientTitle';
import { theme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

/* ═══════════════════════════════════════════════════════
   3-D Floating Bus Icon
   ═══════════════════════════════════════════════════════
   All layers absolutely positioned in a 240×215 container.
   Card center: x=120, y=78.  Card origin: top=18, left=60 (120×120).
   Depth layers offset by +8/+4/+2 px, all share floatY animation.
   Ground shadow stays in place; only scales + fades while card lifts.
   ═══════════════════════════════════════════════════════ */
const CARD = 120;
const CARD_TOP  = 18;
const CARD_LEFT = 60; // (240-120)/2

function HeroBusIcon() {
    const floatY        = useSharedValue(0);
    const shadowScaleX  = useSharedValue(1);
    const shadowOpacity = useSharedValue(0.35);

    useEffect(() => {
        floatY.value = withRepeat(
            withSequence(
                withTiming(-10, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
                withTiming(0,   { duration: 2200, easing: Easing.inOut(Easing.sin) }),
            ),
            -1, false,
        );
        shadowScaleX.value = withRepeat(
            withSequence(
                withTiming(0.50, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
                withTiming(1,    { duration: 2200, easing: Easing.inOut(Easing.sin) }),
            ),
            -1, false,
        );
        shadowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.12, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
                withTiming(0.35, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
            ),
            -1, false,
        );
    }, []);

    const floatStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: floatY.value }],
    }));
    const shadowStyle = useAnimatedStyle(() => ({
        transform: [{ scaleX: shadowScaleX.value }],
        opacity: shadowOpacity.value,
    }));

    return (
        <View style={busStyles.container}>
            {/* ── Aura glow rings ──────────────────────── */}
            <View style={busStyles.aura3} />
            <View style={busStyles.aura2} />
            <View style={busStyles.aura1} />

            {/* ── Depth card stack ───────────────────────── */}
            <Animated.View style={[busStyles.card, busStyles.depth3, floatStyle]} />
            <Animated.View style={[busStyles.card, busStyles.depth2, floatStyle]} />
            <Animated.View style={[busStyles.card, busStyles.depth1, floatStyle]} />

            {/* ── Main card ─────────────────────────────── */}
            <Animated.View style={[busStyles.card, busStyles.mainCard, floatStyle]}>
                <LinearGradient
                    colors={['#c4a8ff', '#7850dc', '#4428b0']}
                    start={{ x: 0.05, y: 0 }}
                    end={{ x: 0.95, y: 1 }}
                    style={StyleSheet.absoluteFill}
                />
                {/* Specular — curved top-light reflection */}
                <View style={busStyles.specular} />
                {/* Inner bottom shadow */}
                <View style={busStyles.innerShadow} />
                {/* Rim lights */}
                <View style={busStyles.rimTop} />
                <View style={busStyles.rimLeft} />
                {/* Icon */}
                <Ionicons name="bus" size={58} color="rgba(255,255,255,0.97)" style={busStyles.busIcon} />
                {/* Speed lines */}
                <View style={busStyles.speedLines}>
                    <View style={[busStyles.speedLine, { width: 20 }]} />
                    <View style={[busStyles.speedLine, { width: 13, opacity: 0.50 }]} />
                    <View style={[busStyles.speedLine, { width: 24, opacity: 0.30 }]} />
                </View>
                {/* Corner glint */}
                <View style={busStyles.glint} />
            </Animated.View>

            {/* ── Ground shadow ellipse ──────────────────── */}
            <Animated.View style={[busStyles.groundShadow, shadowStyle]} />
        </View>
    );
}

const busStyles = StyleSheet.create({
    container: {
        width: 240,
        height: 215,
        alignSelf: 'center',
        marginBottom: theme.spacing.xl,
    },
    // Aura rings — concentric circles centered on card center (120, 78)
    aura3: {
        position: 'absolute', width: 210, height: 210, borderRadius: 105,
        backgroundColor: 'rgba(120,80,220,0.06)',
        top: -27, left: 15,
    },
    aura2: {
        position: 'absolute', width: 170, height: 170, borderRadius: 85,
        backgroundColor: 'rgba(120,80,220,0.09)',
        top: -7, left: 35,
    },
    aura1: {
        position: 'absolute', width: 132, height: 132, borderRadius: 66,
        backgroundColor: 'rgba(120,80,220,0.13)',
        top: 12, left: 54,
    },
    // Base card style — all depth layers + main card share this
    card: {
        position: 'absolute',
        width: CARD, height: CARD, borderRadius: 28,
        borderWidth: 1,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        top: CARD_TOP,
        left: CARD_LEFT,
    },
    depth3: {
        top: CARD_TOP + 8, left: CARD_LEFT + 8,
        backgroundColor: 'rgba(58,28,168,0.22)',
        borderColor: 'rgba(255,255,255,0.07)',
    },
    depth2: {
        top: CARD_TOP + 4, left: CARD_LEFT + 4,
        backgroundColor: 'rgba(80,44,192,0.32)',
        borderColor: 'rgba(255,255,255,0.12)',
    },
    depth1: {
        top: CARD_TOP + 2, left: CARD_LEFT + 2,
        backgroundColor: 'rgba(100,58,208,0.44)',
        borderColor: 'rgba(255,255,255,0.18)',
    },
    mainCard: {
        borderColor: 'rgba(255,255,255,0.35)',
        shadowColor: '#3818a0',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
    },
    specular: {
        position: 'absolute', top: 0,
        left: '8%', right: '8%',
        height: 46, borderRadius: 60,
        backgroundColor: 'rgba(255,255,255,0.18)',
    },
    innerShadow: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 38,
        backgroundColor: 'rgba(0,0,0,0.22)',
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    },
    rimTop: {
        position: 'absolute', top: 0,
        left: '15%', right: '15%',
        height: 1.5,
        backgroundColor: 'rgba(255,255,255,0.55)',
    },
    rimLeft: {
        position: 'absolute',
        top: '15%', bottom: '15%', left: 0,
        width: 1.5,
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    busIcon: { zIndex: 1 },
    speedLines: {
        position: 'absolute',
        left: 8, top: 42,
        gap: 5,
        zIndex: 2,
    },
    speedLine: {
        height: 2, borderRadius: 1,
        backgroundColor: 'rgba(255,255,255,0.72)',
        opacity: 0.70,
    },
    glint: {
        position: 'absolute', top: 10, right: 14,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.60)',
        zIndex: 2,
    },
    groundShadow: {
        position: 'absolute',
        bottom: 6,
        left: 70,      // (240-100)/2
        width: 100, height: 14, borderRadius: 7,
        backgroundColor: 'rgba(68,40,176,0.42)',
    },
});

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <Background variant="aurora" />
            <View style={styles.content}>
                {/* ═══ Hero Area ═══ */}
                <View style={styles.heroSection}>
                    {/* 3-D Floating Bus — spring entrance */}
                    <Animated.View entering={ZoomIn.delay(100).springify().damping(12).stiffness(130)}>
                        <HeroBusIcon />
                    </Animated.View>

                    {/* Title — Space Grotesk Bold gradient headline */}
                    <Animated.View
                        entering={FadeInDown.delay(300).duration(600).springify().damping(18)}
                        style={{ alignItems: 'center', marginTop: 4 }}
                    >
                        <GradientTitle
                            text="OnboardRash"
                            fontSize={46}
                            colors={GRADIENT_PRESETS.auth}
                            fontFamily="SpaceGrotesk_700Bold"
                            fontWeight="700"
                            widthFactor={0.63}
                            letterSpacing={-1.5}
                        />
                    </Animated.View>

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
                <AnimatedEntry delay={700} type="slide-left">
                    <GlassCard tier={1} style={styles.featuresCard}>
                        {[
                            { icon: 'navigate', color: theme.colors.safe, text: 'Real-time GPS tracking', delay: 750 },
                            { icon: 'shield-checkmark', color: theme.colors.info, text: 'Live driving behavior score', delay: 850 },
                            { icon: 'analytics', color: theme.colors.warning, text: 'Trip history & analytics', delay: 950 },
                        ].map((feature, index) => (
                            <Animated.View
                                key={index}
                                entering={FadeInDown.delay(feature.delay).duration(500).springify().damping(18)}
                            >
                                <PressableScale scaleTo={0.97}>
                                    <View style={styles.featureRow}>
                                        <View style={[styles.featureIconBg, { backgroundColor: `${feature.color}15` }]}>
                                            <Ionicons name={feature.icon as any} size={18} color={feature.color} />
                                        </View>
                                        <Text style={styles.featureText}>{feature.text}</Text>
                                    </View>
                                </PressableScale>
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
                        icon={<Ionicons name="arrow-forward" size={18} color={theme.colors.safeText} />}
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
