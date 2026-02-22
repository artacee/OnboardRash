/**
 * Background — Animated atmosphere with gradient orbs + noise overlay.
 * 
 * Matches the web frontend's animated background exactly:
 * - 4 large gradient orbs (purple, pink, cyan, amber)
 * - Floating animation via Reanimated
 * - Soft cool white base (#f5f7fa)
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function FloatingOrb({
    colors,
    size,
    initialX,
    initialY,
    duration,
    dx,
    dy,
}: {
    colors: [string, string, string];
    size: number;
    initialX: number;
    initialY: number;
    duration: number;
    dx: number;
    dy: number;
}) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(dx, { duration, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
        translateY.value = withRepeat(
            withTiming(dy, { duration: duration * 1.3, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: initialX,
                    top: initialY,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    overflow: 'hidden',
                },
                animatedStyle,
            ]}
        >
            <LinearGradient
                colors={colors}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
            />
        </Animated.View>
    );
}

export function Background() {
    return (
        <View style={styles.container}>
            {/* Orb 1 — Purple (top-left) */}
            <FloatingOrb
                colors={[theme.colors.orbPurple, theme.colors.orbPurpleFade, 'transparent']}
                size={SCREEN_WIDTH * 1.2}
                initialX={-SCREEN_WIDTH * 0.3}
                initialY={-SCREEN_HEIGHT * 0.2}
                duration={12000}
                dx={30}
                dy={20}
            />

            {/* Orb 2 — Pink (bottom-right) */}
            <FloatingOrb
                colors={[theme.colors.orbPink, theme.colors.orbPinkFade, 'transparent']}
                size={SCREEN_WIDTH}
                initialX={SCREEN_WIDTH * 0.3}
                initialY={SCREEN_HEIGHT * 0.55}
                duration={15000}
                dx={-25}
                dy={-30}
            />

            {/* Orb 3 — Cyan (center-left) */}
            <FloatingOrb
                colors={[theme.colors.orbCyan, theme.colors.orbCyanFade, 'transparent']}
                size={SCREEN_WIDTH * 0.9}
                initialX={-SCREEN_WIDTH * 0.15}
                initialY={SCREEN_HEIGHT * 0.35}
                duration={18000}
                dx={35}
                dy={-15}
            />

            {/* Orb 4 — Amber (top-right) */}
            <FloatingOrb
                colors={[theme.colors.orbAmber, theme.colors.orbAmberFade, 'transparent']}
                size={SCREEN_WIDTH * 0.8}
                initialX={SCREEN_WIDTH * 0.35}
                initialY={SCREEN_HEIGHT * 0.15}
                duration={14000}
                dx={-20}
                dy={25}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: theme.colors.bgBase,
        overflow: 'hidden',
        zIndex: -1,
    },
});
