/**
 * Background — Living, breathing atmosphere with floating color orbs.
 *
 * Variants:
 *  - default  — lavender / pastel (original)
 *  - aurora   — deep indigo + northern-light neons  (sign-in / register)
 *  - cockpit  — dark slate + 3-layer parallax depth (home / trip)
 *  - dusk     — warm mauve + terracotta / gold       (history)
 *  - portrait — avatar-ring palette mirrored faintly (profile)
 *
 * Cockpit "3D" trick: three render layers (back / mid / front) with
 * decreasing size, faster speed, and higher opacity — creates depth.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

/* ─── Floating Orb ─────────────────────────────────────────── */
interface OrbProps {
    color: string;
    size: number;
    x: number;
    y: number;
    duration: number;
    dx: number;
    dy: number;
    opacity: number;
    scaleRange?: [number, number];
    rotateRange?: number;
    breathDuration?: number;
    /** Render with layered highlight/shadow for a lit-sphere look */
    sphere3d?: boolean;
}

function FloatingOrb({
    color,
    size,
    x,
    y,
    duration,
    dx,
    dy,
    opacity,
    scaleRange = [0.92, 1.08],
    rotateRange = 15,
    breathDuration = 6000,
    sphere3d = false,
}: OrbProps) {
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const sc = useSharedValue(1);
    const rot = useSharedValue(0);

    useEffect(() => {
        tx.value = withRepeat(
            withTiming(dx, { duration, easing: Easing.inOut(Easing.sin) }),
            -1, true,
        );
        ty.value = withRepeat(
            withTiming(dy, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
            -1, true,
        );
        sc.value = withRepeat(
            withSequence(
                withTiming(scaleRange[1], { duration: breathDuration, easing: Easing.inOut(Easing.sin) }),
                withTiming(scaleRange[0], { duration: breathDuration, easing: Easing.inOut(Easing.sin) }),
            ),
            -1, true,
        );
        rot.value = withRepeat(
            withSequence(
                withTiming(rotateRange, { duration: duration * 1.6, easing: Easing.inOut(Easing.sin) }),
                withTiming(-rotateRange, { duration: duration * 1.6, easing: Easing.inOut(Easing.sin) }),
            ),
            -1, true,
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: tx.value },
            { translateY: ty.value },
            { scale: sc.value },
            { rotate: `${rot.value}deg` },
        ],
    }));

    const half = size / 2;

    return (
        <>
            <Animated.View
                style={[
                    {
                        position: 'absolute',
                        left: x - half,
                        top: y - half,
                        width: size,
                        height: size,
                        borderRadius: half,
                        backgroundColor: color,
                        opacity,
                    },
                    Platform.OS === 'ios' && {
                        shadowColor: color,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.6,
                        shadowRadius: size * 0.45,
                    },
                    animatedStyle,
                ]}
            >
                {/* ── 3D sphere layers ── */}
                {sphere3d && (
                    <>
                        {/* Dark bottom crescent — shadow side */}
                        <View style={{
                            position: 'absolute',
                            bottom: size * 0.05,
                            left: size * 0.15,
                            width: size * 0.7,
                            height: size * 0.45,
                            borderRadius: size * 0.35,
                            backgroundColor: 'rgba(0,0,0,0.22)',
                        }} />
                        {/* Mid-body glow ring — equator highlight */}
                        <View style={{
                            position: 'absolute',
                            top: size * 0.22,
                            left: size * 0.12,
                            width: size * 0.76,
                            height: size * 0.52,
                            borderRadius: size * 0.38,
                            backgroundColor: 'rgba(255,255,255,0.08)',
                        }} />
                        {/* Primary specular highlight — top-left hot spot */}
                        <View style={{
                            position: 'absolute',
                            top: size * 0.12,
                            left: size * 0.18,
                            width: size * 0.38,
                            height: size * 0.32,
                            borderRadius: size * 0.2,
                            backgroundColor: 'rgba(255,255,255,0.35)',
                        }} />
                        {/* Tiny sharp glint */}
                        <View style={{
                            position: 'absolute',
                            top: size * 0.16,
                            left: size * 0.26,
                            width: size * 0.12,
                            height: size * 0.09,
                            borderRadius: size * 0.06,
                            backgroundColor: 'rgba(255,255,255,0.55)',
                        }} />
                    </>
                )}
            </Animated.View>
            {/* Android: secondary faint halo circle to fake the blur */}
            {Platform.OS === 'android' && (
                <Animated.View
                    style={[
                        {
                            position: 'absolute',
                            left: x - half * 1.4,
                            top: y - half * 1.4,
                            width: size * 1.4,
                            height: size * 1.4,
                            borderRadius: (size * 1.4) / 2,
                            backgroundColor: color,
                            opacity: opacity * 0.35,
                        },
                        animatedStyle,
                    ]}
                />
            )}
        </>
    );
}

/* ═══════════════════════════════════════════════════════════════
   Variant configs — each is a base color + array of OrbProps
   ═══════════════════════════════════════════════════════════════ */

type VariantKey = 'default' | 'aurora' | 'cockpit' | 'ember' | 'dusk' | 'portrait';

interface VariantConfig {
    bgColor: string;
    orbs: OrbProps[];
}

const variants: Record<VariantKey, VariantConfig> = {
    /* ── Default (lavender pastel — fallback) ─────────────── */
    default: {
        bgColor: '#ede8ff',
        orbs: [
            { color: 'rgba(120,80,220,0.75)', size: W * 0.85, x: W * 0.15, y: H * 0.08, duration: 12000, dx: 30, dy: 20, opacity: 0.55, scaleRange: [0.90, 1.10], rotateRange: 12, breathDuration: 7000 },
            { color: 'rgba(255,120,170,0.70)', size: W * 0.75, x: W * 0.78, y: H * 0.72, duration: 15000, dx: -25, dy: -30, opacity: 0.48, scaleRange: [0.93, 1.07], rotateRange: 18, breathDuration: 6000 },
            { color: 'rgba(60,190,255,0.65)', size: W * 0.7, x: W * 0.1, y: H * 0.45, duration: 18000, dx: 35, dy: -15, opacity: 0.42, scaleRange: [0.88, 1.06], rotateRange: 10, breathDuration: 8000 },
            { color: 'rgba(255,200,80,0.65)', size: W * 0.6, x: W * 0.82, y: H * 0.2, duration: 14000, dx: -20, dy: 25, opacity: 0.38, scaleRange: [0.94, 1.09], rotateRange: 14, breathDuration: 5500 },
            { color: 'rgba(80,220,180,0.65)', size: W * 0.55, x: W * 0.45, y: H * 0.85, duration: 16000, dx: 20, dy: -18, opacity: 0.35, scaleRange: [0.91, 1.08], rotateRange: 16, breathDuration: 6500 },
        ],
    },

    /* ── Aurora (sign-in / register) — cool deep lavender + neons ─ */
    aurora: {
        bgColor: '#d8d0f0',
        orbs: [
            // Electric violet — large slow curtain
            { color: 'rgba(100,40,220,0.75)', size: W * 1.1, x: W * 0.3, y: H * 0.12, duration: 16000, dx: 40, dy: 20, opacity: 0.50, scaleRange: [0.88, 1.12], rotateRange: 8, breathDuration: 9000 },
            // Ice blue — sweeping mid
            { color: 'rgba(40,180,255,0.65)', size: W * 0.8, x: W * 0.72, y: H * 0.4, duration: 20000, dx: -35, dy: -25, opacity: 0.45, scaleRange: [0.90, 1.08], rotateRange: 12, breathDuration: 7500 },
            // Emerald — bottom accent
            { color: 'rgba(30,200,120,0.60)', size: W * 0.6, x: W * 0.18, y: H * 0.72, duration: 14000, dx: 25, dy: -20, opacity: 0.38, scaleRange: [0.92, 1.06], rotateRange: 10, breathDuration: 6000 },
            // Magenta — top-right warmth
            { color: 'rgba(220,60,160,0.55)', size: W * 0.5, x: W * 0.85, y: H * 0.08, duration: 18000, dx: -15, dy: 15, opacity: 0.30, scaleRange: [0.94, 1.05], rotateRange: 14, breathDuration: 8000 },
        ],
    },

    /* ── Cockpit / Midnight Road (home idle) — deep navy vignette, minimal ─ */
    cockpit: {
        bgColor: '#d8dce8',
        orbs: [
            // Warm amber "streetlight" — slow drifting glow top-right
            { color: 'rgba(255,190,80,0.50)', size: W * 0.85, x: W * 0.72, y: H * 0.12, duration: 22000, dx: -18, dy: 12, opacity: 0.38, scaleRange: [0.93, 1.06], rotateRange: 6, breathDuration: 10000 },
            // Cool blue moonlight — large diffused bottom-left
            { color: 'rgba(60,100,200,0.45)', size: W * 1.0, x: W * 0.15, y: H * 0.55, duration: 26000, dx: 15, dy: -10, opacity: 0.30, scaleRange: [0.95, 1.04], rotateRange: 4, breathDuration: 12000 },
            // Faint slate depth — very subtle background fill
            { color: 'rgba(80,90,140,0.35)', size: W * 0.6, x: W * 0.5, y: H * 0.82, duration: 20000, dx: -10, dy: 8, opacity: 0.22, scaleRange: [0.96, 1.03], rotateRange: 3, breathDuration: 14000 },
        ],
    },

    /* ── Ember Glow (active trip) — warm cream, burnt orange + burgundy ─ */
    ember: {
        bgColor: '#f0e8df',
        orbs: [
            // Burnt orange — large dominant orb
            { color: 'rgba(230,120,50,0.60)', size: W * 1.0, x: W * 0.3, y: H * 0.18, duration: 16000, dx: 28, dy: 15, opacity: 0.45, scaleRange: [0.88, 1.10], rotateRange: 10, breathDuration: 7000 },
            // Deep burgundy — moody accent bottom-right
            { color: 'rgba(160,40,60,0.50)', size: W * 0.75, x: W * 0.78, y: H * 0.65, duration: 18000, dx: -22, dy: -18, opacity: 0.38, scaleRange: [0.90, 1.08], rotateRange: 8, breathDuration: 8500 },
            // Cool steel blue — contrast accent
            { color: 'rgba(70,120,190,0.45)', size: W * 0.55, x: W * 0.12, y: H * 0.72, duration: 14000, dx: 20, dy: -12, opacity: 0.32, scaleRange: [0.92, 1.07], rotateRange: 12, breathDuration: 6000 },
            // Warm amber glow — small energetic front particle
            { color: 'rgba(255,180,60,0.50)', size: W * 0.35, x: W * 0.6, y: H * 0.35, duration: 10000, dx: -15, dy: 20, opacity: 0.35, scaleRange: [0.86, 1.12], rotateRange: 16, breathDuration: 5000 },
        ],
    },

    /* ── Dusk (history) — warm dusty mauve + earth tones ──── */
    dusk: {
        bgColor: '#f5ede8',
        orbs: [
            // Terracotta / rose — large top-left
            { color: 'rgba(205,120,100,0.65)', size: W * 0.9, x: W * 0.15, y: H * 0.1, duration: 16000, dx: 25, dy: 15, opacity: 0.48, scaleRange: [0.90, 1.08], rotateRange: 10, breathDuration: 8000 },
            // Pale gold — mid-right
            { color: 'rgba(230,190,100,0.55)', size: W * 0.65, x: W * 0.8, y: H * 0.4, duration: 14000, dx: -20, dy: 20, opacity: 0.40, scaleRange: [0.92, 1.07], rotateRange: 12, breathDuration: 6500 },
            // Muted slate blue — bottom
            { color: 'rgba(100,120,170,0.50)', size: W * 0.7, x: W * 0.35, y: H * 0.75, duration: 18000, dx: 18, dy: -15, opacity: 0.35, scaleRange: [0.93, 1.06], rotateRange: 8, breathDuration: 7000 },
            // Dusty pink — soft accent
            { color: 'rgba(190,140,150,0.45)', size: W * 0.5, x: W * 0.6, y: H * 0.2, duration: 20000, dx: -12, dy: 18, opacity: 0.30, scaleRange: [0.95, 1.05], rotateRange: 6, breathDuration: 9000 },
        ],
    },

    /* ── Portrait (profile) — soft watercolor wash echoing avatar ring ─ */
    portrait: {
        bgColor: '#ece6fb',  // Warmer/deeper lavender than aurora — distinctly "profile"
        orbs: [
            // Large violet halo — centered top, like a crown above the avatar
            { color: 'rgba(110,70,210,0.55)', size: W * 1.1, x: W * 0.5, y: H * 0.05, duration: 26000, dx: 10, dy: 8, opacity: 0.38, scaleRange: [0.94, 1.06], rotateRange: 5, breathDuration: 14000 },
            // Blush pink bloom — right mid, drifting gently (ring segment #2)
            { color: 'rgba(240,100,160,0.50)', size: W * 0.80, x: W * 0.82, y: H * 0.38, duration: 20000, dx: -12, dy: -10, opacity: 0.33, scaleRange: [0.93, 1.07], rotateRange: 8, breathDuration: 11000 },
            // Sky cyan wash — lower-left anchor, cool contrast (ring segment #3)
            { color: 'rgba(40,180,245,0.45)', size: W * 0.90, x: W * 0.1, y: H * 0.62, duration: 24000, dx: 14, dy: -8, opacity: 0.28, scaleRange: [0.95, 1.05], rotateRange: 6, breathDuration: 13000 },
            // Amber shimmer — small, floats top-right (ring segment #4)
            { color: 'rgba(255,195,70,0.45)', size: W * 0.40, x: W * 0.78, y: H * 0.10, duration: 18000, dx: -8, dy: 12, opacity: 0.30, scaleRange: [0.92, 1.08], rotateRange: 12, breathDuration: 8000 },
            // Deep rose depth — bottom center, grounds the composition
            { color: 'rgba(200,70,130,0.35)', size: W * 0.60, x: W * 0.42, y: H * 0.84, duration: 22000, dx: 10, dy: -6, opacity: 0.22, scaleRange: [0.96, 1.04], rotateRange: 4, breathDuration: 12000 },
        ],
    },
};

/* ─── Background Component ─────────────────────────────────── */
interface BackgroundProps {
    variant?: VariantKey;
}

export function Background({ variant = 'default' }: BackgroundProps) {
    const config = variants[variant];
    return (
        <View style={[styles.container, { backgroundColor: config.bgColor }]} pointerEvents="none">
            {config.orbs.map((orb, i) => (
                <FloatingOrb key={`${variant}-${i}`} {...orb} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        zIndex: -1,
    },
});
