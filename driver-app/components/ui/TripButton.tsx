/**
 * TripButton — Pulsing morphing trip control button.
 * 
 * Start state: Green breathing glow with play icon
 * Active state: Red pulse with radiating ring + stop icon
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    withSpring,
    Easing,
    interpolateColor,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';

interface TripButtonProps {
    isActive: boolean;
    onPress: () => void;
    loading?: boolean;
}

export function TripButton({ isActive, onPress, loading = false }: TripButtonProps) {
    const breathScale = useSharedValue(1);
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0);
    const colorProgress = useSharedValue(isActive ? 1 : 0);

    useEffect(() => {
        colorProgress.value = withSpring(isActive ? 1 : 0, {
            damping: 15,
            stiffness: 100,
        });

        if (!isActive) {
            // Gentle breathing for start button
            breathScale.value = withRepeat(
                withSequence(
                    withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.97, { duration: 1500, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                true
            );
            pulseScale.value = 1;
            pulseOpacity.value = 0;
        } else {
            // Pulse ring for stop button
            breathScale.value = withTiming(1, { duration: 300 });
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 0 }),
                    withTiming(1.8, { duration: 1600, easing: Easing.out(Easing.cubic) })
                ),
                -1,
                false
            );
            pulseOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.5, { duration: 0 }),
                    withTiming(0, { duration: 1600, easing: Easing.out(Easing.cubic) })
                ),
                -1,
                false
            );
        }
    }, [isActive]);

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breathScale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => {
        const bg = interpolateColor(
            colorProgress.value,
            [0, 1],
            ['rgba(52, 211, 153, 0.15)', 'rgba(248, 113, 113, 0.15)']
        );
        return { backgroundColor: bg };
    });

    const pulseRingStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }));

    const handlePress = () => {
        Haptics.impactAsync(
            isActive ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium
        );
        onPress();
    };

    const buttonBg = isActive ? 'rgba(248, 113, 113, 0.25)' : 'rgba(52, 211, 153, 0.25)';
    const textColor = isActive ? '#b91c1c' : '#047857';
    const iconName = isActive ? 'stop' : 'play';
    const label = isActive ? 'End Trip' : 'Start Trip';

    return (
        <View style={styles.wrapper}>
            {/* Ambient glow behind button */}
            <Animated.View style={[styles.ambientGlow, glowStyle]} />

            {/* Pulse ring (active state only) */}
            {isActive && (
                <Animated.View
                    style={[
                        styles.pulseRing,
                        { borderColor: theme.colors.danger },
                        pulseRingStyle,
                    ]}
                />
            )}

            {/* Main button */}
            <Animated.View style={buttonStyle}>
                <TouchableOpacity
                    onPress={handlePress}
                    disabled={loading}
                    activeOpacity={0.7}
                    style={[styles.button, { backgroundColor: buttonBg }]}
                >
                    <BlurView
                        intensity={20}
                        tint="light"
                        style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.full, overflow: 'hidden' }]}
                    />
                    {loading ? (
                        <ActivityIndicator size="small" color={textColor} />
                    ) : (
                        <>
                            <Ionicons name={iconName} size={22} color={textColor} />
                            <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
                        </>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 80,
    },
    ambientGlow: {
        position: 'absolute',
        width: 240,
        height: 60,
        borderRadius: 30,
    },
    pulseRing: {
        position: 'absolute',
        width: 220,
        height: 56,
        borderRadius: 28,
        borderWidth: 1.5,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingVertical: 16,
        paddingHorizontal: 48,
        borderRadius: theme.radius.full,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.4)',
        overflow: 'hidden',
        minWidth: 200,
    },
    buttonText: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.body,
        fontWeight: theme.fontWeight.title,
    },
});
