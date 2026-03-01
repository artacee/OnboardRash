/**
 * TripButton — Premium trip control with physical feel.
 *
 * Features:
 * - Breathing scale (idle) / radiating pulse (active)
 * - Animated icon transition with scale through zero
 * - Shaped ambient glow matching pill form
 * - Wider pulse ring spread (1→2.2)
 * - Deep spring press (0.91)
 * - Full glass border
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Platform } from 'react-native';
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
    const pressScale = useSharedValue(1);
    const iconScale = useSharedValue(1);
    const glowBreath = useSharedValue(1);

    useEffect(() => {
        colorProgress.value = withSpring(isActive ? 1 : 0, theme.spring.gentle);

        // Icon transition: scale to 0, then back to 1
        iconScale.value = withSequence(
            withTiming(0, { duration: 120 }),
            withSpring(1, { damping: 12, stiffness: 200 }),
        );

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

            // Glow breathes with button
            glowBreath.value = withRepeat(
                withSequence(
                    withTiming(1.06, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.94, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
                ),
                -1,
                true,
            );
        } else {
            // Pulse ring for stop button
            breathScale.value = withTiming(1, { duration: 300 });
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 0 }),
                    withTiming(2.2, { duration: 1600, easing: Easing.out(Easing.cubic) })
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
            glowBreath.value = withRepeat(
                withSequence(
                    withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.92, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
                ),
                -1,
                true,
            );
        }
    }, [isActive]);

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: breathScale.value * pressScale.value }],
    }));

    const glowStyle = useAnimatedStyle(() => {
        const bg = interpolateColor(
            colorProgress.value,
            [0, 1],
            [theme.colors.safeBg, theme.colors.dangerBg]
        );
        return {
            backgroundColor: bg,
            transform: [{ scale: glowBreath.value }],
        };
    });

    const pulseRingStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }));

    const iconAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    const handlePress = () => {
        Haptics.impactAsync(
            isActive ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium
        );
        onPress();
    };

    const buttonBg = isActive ? theme.colors.dangerBtnBg : theme.colors.primaryBg;
    const textColor = isActive ? theme.colors.dangerText : theme.colors.safeText;
    const iconName = isActive ? 'stop' : 'play';
    const label = isActive ? 'End Trip' : 'Start Trip';

    return (
        <View style={styles.wrapper}>
            {/* Ambient glow — shaped to match pill, breathes */}
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
                <Pressable
                    onPress={handlePress}
                    onPressIn={() => { pressScale.value = withSpring(0.91, theme.spring.press); }}
                    onPressOut={() => { pressScale.value = withSpring(1, theme.spring.press); }}
                    disabled={loading}
                    style={[styles.button, { backgroundColor: buttonBg }]}
                >
                    <BlurView
                        intensity={Platform.OS === 'android' ? 15 : 25}
                        tint="light"
                        style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.full, overflow: 'hidden' }]}
                    />
                    {loading ? (
                        <ActivityIndicator size="small" color={textColor} />
                    ) : (
                        <Animated.View style={[styles.buttonContent, iconAnimStyle]}>
                            <Ionicons name={iconName} size={22} color={textColor} />
                            <Text style={[styles.buttonText, { color: textColor }]}>{label}</Text>
                        </Animated.View>
                    )}
                </Pressable>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 90,
    },
    ambientGlow: {
        position: 'absolute',
        width: 240,
        height: 60,
        borderRadius: theme.radius.full,
    },
    pulseRing: {
        position: 'absolute',
        width: 220,
        height: 56,
        borderRadius: theme.radius.full,
        borderWidth: 2,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.base,
        paddingHorizontal: theme.spacing['3xl'],
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderTopColor: theme.colors.glassBorderLight,
        borderLeftColor: theme.colors.glassBorder,
        borderRightColor: theme.colors.glassBorder,
        borderBottomColor: theme.colors.glassBorderDark,
        overflow: 'hidden',
        minWidth: 200,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    buttonText: {
        fontFamily: theme.fonts.title,
        fontSize: theme.fontSize.body,
        fontWeight: theme.fontWeight.title,
    },
});
