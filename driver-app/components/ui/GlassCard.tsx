/**
 * GlassCard — Premium frosted glass card with depth, light refraction,
 * and per-tier visual hierarchy.
 *
 * Features:
 * - Full perimeter border with brighter top / darker bottom
 * - Inner bottom shadow for "light from above" illusion
 * - Specular top highlight
 * - Per-tier padding & shadow depth
 * - Optional glowing state (active trip, etc.)
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    contentStyle?: ViewStyle;
    tier?: 0 | 1 | 2;
    noPadding?: boolean;
    glowing?: boolean;
    glowColor?: string;
}

export function GlassCard({
    children,
    style,
    contentStyle,
    tier = 1,
    noPadding = false,
    glowing = false,
    glowColor = theme.colors.info,
}: GlassCardProps) {
    const isAndroid = Platform.OS === 'android';

    const bgColors = {
        0: isAndroid ? theme.colors.glassTier0Android : theme.colors.glassTier0,
        1: isAndroid ? theme.colors.glassTier1Android : theme.colors.glassTier1,
        2: isAndroid ? theme.colors.glassTier2Android : theme.colors.glassTier2,
    };

    const blurIntensity = {
        0: isAndroid ? 0 : 55,
        1: isAndroid ? 0 : 38,
        2: isAndroid ? 0 : 20,
    };

    const radii = {
        0: theme.radius.xxxl,
        1: theme.radius.xl,
        2: theme.radius.lg,
    };

    const paddings = {
        0: theme.spacing['2xl'],
        1: theme.spacing.xl,
        2: theme.spacing.lg,
    };

    const shadowLevel = {
        0: theme.shadows.lg,
        1: theme.shadows.md,
        2: theme.shadows.sm,
    };

    // Glow pulse animation
    const glowOpacity = useSharedValue(0);
    useEffect(() => {
        if (glowing) {
            glowOpacity.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
                ),
                -1,
                true,
            );
        } else {
            glowOpacity.value = withTiming(0, { duration: 300 });
        }
    }, [glowing]);

    const glowStyle = useAnimatedStyle(() => {
        if (!glowing) return {};
        if (Platform.OS === 'ios') {
            return {
                shadowColor: glowColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.25 * glowOpacity.value,
                shadowRadius: 24,
            };
        }
        return {};
    });

    return (
        <Animated.View
            style={[
                // On Android: no overflow:hidden (forces off-screen buffer, killing translucency)
                // and no elevation (same isolation problem). Border radius still rounds visually.
                isAndroid ? styles.containerAndroid : styles.container,
                {
                    borderRadius: radii[tier],
                    backgroundColor: bgColors[tier],
                },
                // On Android strip elevation — it creates a GPU compositing layer that
                // composites against white instead of the real background.
                isAndroid ? {} : shadowLevel[tier],
                !noPadding && { padding: paddings[tier] },
                glowStyle,
                style,
            ]}
        >
            {/* BlurView — frosted glass base (iOS only; Android uses solid bg) */}
            {!isAndroid && (
                <BlurView
                    intensity={blurIntensity[tier]}
                    tint="default"
                    style={[StyleSheet.absoluteFill, { borderRadius: radii[tier] }]}
                />
            )}
            {/* Specular top edge + inner bottom shadow — iOS only.
                These are position:absolute overlays that require overflow:hidden to clip
                to the card's border radius. On Android overflow:hidden breaks glass
                transparency, so we skip them entirely to avoid line artifacts. */}
            {!isAndroid && (
                <>
                    <View
                        style={[
                            styles.specularEdge,
                            { borderTopLeftRadius: radii[tier], borderTopRightRadius: radii[tier] },
                        ]}
                    />
                    <View
                        style={[
                            styles.innerShadow,
                            {
                                borderBottomLeftRadius: radii[tier],
                                borderBottomRightRadius: radii[tier],
                            },
                        ]}
                    />
                </>
            )}
            {/* Content — borderRadius on Android keeps visual rounding without overflow:hidden
                which would isolate compositing and make the inner label clip at the corner */}
            <View style={[
                styles.content,
                isAndroid && { borderRadius: radii[tier] },
                contentStyle,
            ]}>
                {children}
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden', // iOS: safe, doesn't break compositing
        borderWidth: 1,
        borderTopColor: theme.colors.glassBorderLight,
        borderLeftColor: theme.colors.glassBorder,
        borderRightColor: theme.colors.glassBorder,
        borderBottomColor: theme.colors.glassBorderDark,
    },
    containerAndroid: {
        // No overflow:hidden — lets Android composite against real background
        borderWidth: 1,
        borderTopColor: theme.colors.glassBorderLight,
        borderLeftColor: theme.colors.glassBorder,
        borderRightColor: theme.colors.glassBorder,
        borderBottomColor: theme.colors.glassBorderDark,
    },
    specularEdge: {
        position: 'absolute',
        top: 0,
        left: '8%',
        right: '8%',
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.75)',
    },
    innerShadow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: theme.colors.innerShadow,
    },
    content: {
        position: 'relative',
        zIndex: 1,
        alignSelf: 'stretch',
    },
});
