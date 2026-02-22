/**
 * PulseDot — Breathing/radar-pulse status indicator.
 * 
 * Active state: pulsing glow ring that radiates outward.
 * Inactive state: static gray dot.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface PulseDotProps {
    active: boolean;
    color?: string;
    size?: number;
}

export function PulseDot({
    active,
    color = theme.colors.safe,
    size = 10,
}: PulseDotProps) {
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0.6);

    useEffect(() => {
        if (active) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(2.2, { duration: 1200, easing: Easing.out(Easing.cubic) }),
                    withTiming(1, { duration: 0 })
                ),
                -1,
                false
            );
            pulseOpacity.value = withRepeat(
                withSequence(
                    withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
                    withTiming(0.6, { duration: 0 })
                ),
                -1,
                false
            );
        } else {
            pulseScale.value = withTiming(1, { duration: 300 });
            pulseOpacity.value = withTiming(0, { duration: 300 });
        }
    }, [active]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
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
            {/* Core dot */}
            <View
                style={[
                    styles.dot,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        backgroundColor: active ? color : theme.colors.textQuaternary,
                    },
                ]}
            />
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
        borderWidth: 1.5,
    },
    dot: {},
});
