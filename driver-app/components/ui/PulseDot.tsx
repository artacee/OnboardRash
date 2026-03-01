/**
 * PulseDot — Living status indicator with radar pulse + breathing core.
 *
 * Features:
 * - Radar pulse ring that fades outward
 * - Core dot breathes (subtle scale oscillation)
 * - `delay` prop for staggered timing across multiple dots
 * - iOS shadow glow, Android faint background circle fallback
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface PulseDotProps {
    active: boolean;
    color?: string;
    size?: number;
    delay?: number;
}

export function PulseDot({
    active,
    color = theme.colors.safe,
    size = 10,
    delay: delayMs = 0,
}: PulseDotProps) {
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0.6);
    const breatheScale = useSharedValue(1);

    useEffect(() => {
        if (active) {
            // Radar pulse
            pulseScale.value = withDelay(
                delayMs,
                withRepeat(
                    withSequence(
                        withTiming(2.4, { duration: 1200, easing: Easing.out(Easing.cubic) }),
                        withTiming(1, { duration: 0 })
                    ),
                    -1,
                    false
                ),
            );
            pulseOpacity.value = withDelay(
                delayMs,
                withRepeat(
                    withSequence(
                        withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
                        withTiming(0.6, { duration: 0 })
                    ),
                    -1,
                    false
                ),
            );
            // Core dot breathing
            breatheScale.value = withDelay(
                delayMs,
                withRepeat(
                    withSequence(
                        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
                        withTiming(0.9, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
                    ),
                    -1,
                    true,
                ),
            );
        } else {
            pulseScale.value = withTiming(1, { duration: 300 });
            pulseOpacity.value = withTiming(0, { duration: 300 });
            breatheScale.value = withTiming(1, { duration: 300 });
        }
    }, [active]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }));

    const dotStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breatheScale.value }],
    }));

    return (
        <View style={[styles.container, { width: size * 2.5, height: size * 2.5 }]}>
            {/* Pulse ring */}
            <Animated.View
                style={[
                    styles.pulseRing,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderColor: active ? color : 'transparent',
                    },
                    pulseStyle,
                ]}
            />
            {/* Core dot with glow + breathing */}
            <Animated.View
                style={[
                    styles.dot,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: active ? color : theme.colors.textTertiary,
                    },
                    active && Platform.OS === 'ios' && {
                        shadowColor: color,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.6,
                        shadowRadius: 6,
                    },
                    dotStyle,
                ]}
            />
            {/* Android glow fallback */}
            {active && Platform.OS === 'android' && (
                <View
                    style={[
                        styles.androidGlow,
                        {
                            width: size * 2,
                            height: size * 2,
                            borderRadius: size,
                            backgroundColor: color,
                        },
                    ]}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pulseRing: {
        position: 'absolute',
        borderWidth: 2,
    },
    dot: {},
    androidGlow: {
        position: 'absolute',
        opacity: 0.15,
        zIndex: -1,
    },
});
