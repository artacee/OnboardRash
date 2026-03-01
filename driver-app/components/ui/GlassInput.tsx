/**
 * GlassInput — Premium glass input with animated floating label & focus glow.
 *
 * Features:
 * - Label floats up when focused or has value
 * - Animated border color transition
 * - iOS focus shadow glow
 * - Inner shadow for recessed feel
 * - Error & success states
 */

import React, { useState } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    interpolateColor,
    interpolate,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface GlassInputProps extends TextInputProps {
    label?: string;
    error?: string;
    valid?: boolean;
}

export function GlassInput({ label, error, valid, style, value, onFocus, onBlur, ...props }: GlassInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const focus = useSharedValue(0);
    const labelFloat = useSharedValue(value ? 1 : 0);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        focus.value = withTiming(1, { duration: 200 });
        labelFloat.value = withSpring(1, theme.spring.smooth);
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        focus.value = withTiming(0, { duration: 200 });
        if (!value) {
            labelFloat.value = withSpring(0, theme.spring.smooth);
        }
        onBlur?.(e);
    };

    // Keep label floated when value changes externally
    React.useEffect(() => {
        if (value && labelFloat.value === 0) {
            labelFloat.value = withSpring(1, theme.spring.smooth);
        } else if (!value && !isFocused) {
            labelFloat.value = withSpring(0, theme.spring.smooth);
        }
    }, [value]);

    const animContainerStyle = useAnimatedStyle(() => {
        const borderColor = error
            ? theme.colors.danger
            : valid
                ? theme.colors.safe
                : interpolateColor(
                    focus.value,
                    [0, 1],
                    ['rgba(255, 255, 255, 0.35)', 'rgba(96, 165, 250, 0.55)']
                );
        return {
            borderColor,
            borderWidth: 1.5,
            ...(Platform.OS === 'ios' && focus.value > 0.5
                ? {
                    shadowColor: error ? theme.colors.danger : valid ? theme.colors.safe : theme.colors.info,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.2 * focus.value,
                    shadowRadius: 12,
                }
                : {}),
        };
    });

    const labelAnimStyle = useAnimatedStyle(() => {
        const translateY = interpolate(labelFloat.value, [0, 1], [0, -24]);
        const scale = interpolate(labelFloat.value, [0, 1], [1, 0.82]);
        const opacity = interpolate(labelFloat.value, [0, 1], [0.5, 1]);
        return {
            transform: [{ translateY }, { scale }],
            opacity,
        };
    });

    return (
        <View style={styles.wrapper}>
            {/* Floating label */}
            {label && (
                <Animated.Text style={[styles.floatingLabel, labelAnimStyle]}>
                    {label}
                </Animated.Text>
            )}
            <Animated.View
                style={[
                    styles.inputContainer,
                    animContainerStyle,
                ]}
            >
                <BlurView
                    intensity={Platform.OS === 'android' ? 15 : 25}
                    tint="light"
                    style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.md, overflow: 'hidden' }]}
                />
                {/* Inner shadow — recessed feel (iOS only, same overflow:hidden dependency) */}
                {Platform.OS !== 'android' && <View style={styles.innerShadow} />}
                <TextInput
                    style={[styles.input, label && styles.inputWithLabel, style]}
                    placeholderTextColor={theme.colors.textTertiary}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    value={value}
                    {...props}
                />
                {/* Success check icon */}
                {valid && !error && (
                    <View style={styles.validIcon}>
                        <Ionicons name="checkmark-circle" size={18} color={theme.colors.safe} />
                    </View>
                )}
            </Animated.View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: theme.spacing.base,
    },
    floatingLabel: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        transformOrigin: 'left center',
    },
    inputContainer: {
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.glassTier2,
        borderTopWidth: 0,  // override — unified border from animContainerStyle
        // No overflow:hidden — on Android it creates an isolated compositing buffer
        // making the background composite against white instead of the real bg.
        flexDirection: 'row',
        alignItems: 'center',
    },
    innerShadow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: theme.colors.innerShadow,
    },
    input: {
        flex: 1,
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.body,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textPrimary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.base,
        position: 'relative',
        zIndex: 1,
    },
    inputWithLabel: {
        paddingTop: theme.spacing.md + 2,
    },
    validIcon: {
        paddingRight: theme.spacing.md,
        zIndex: 1,
    },
    errorText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        color: theme.colors.danger,
        marginTop: theme.spacing.xs,
    },
});
