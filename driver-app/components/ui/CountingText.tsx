/**
 * CountingText — Animated number that counts from 0 to target value.
 *
 * Uses reanimated's TextInput pattern for frame-perfect text animation
 * without triggering React re-renders on each frame.
 */

import React, { useEffect } from 'react';
import { TextInput, StyleSheet, TextStyle, StyleProp, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    withDelay,
    withSpring,
    Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface CountingTextProps {
    value: number;
    duration?: number;
    delay?: number;
    useSpring?: boolean;
    decimals?: number;
    suffix?: string;
    prefix?: string;
    style?: StyleProp<TextStyle>;
}

export function CountingText({
    value,
    duration = 1200,
    delay: delayMs = 300,
    useSpring: spring = false,
    decimals = 0,
    suffix = '',
    prefix = '',
    style,
}: CountingTextProps) {
    const animValue = useSharedValue(0);

    useEffect(() => {
        if (spring) {
            animValue.value = withDelay(
                delayMs,
                withSpring(value, { damping: 14, stiffness: 60, mass: 1 })
            );
        } else {
            animValue.value = withDelay(
                delayMs,
                withTiming(value, {
                    duration,
                    easing: Easing.out(Easing.cubic),
                })
            );
        }
    }, [value]);

    const animatedProps = useAnimatedProps(() => {
        const num = decimals > 0
            ? animValue.value.toFixed(decimals)
            : Math.round(animValue.value).toString();
        return {
            text: `${prefix}${num}${suffix}`,
            // defaultValue is needed for Android
            defaultValue: `${prefix}${num}${suffix}`,
        } as any;
    });

    return (
        <AnimatedTextInput
            underlineColorAndroid="transparent"
            editable={false}
            animatedProps={animatedProps}
            style={[styles.text, style]}
            // Prevent selection/cursor
            caretHidden
            contextMenuHidden
        />
    );
}

const styles = StyleSheet.create({
    text: {
        // Reset TextInput defaults
        padding: 0,
        margin: 0,
        borderWidth: 0,
        // The consumer passes font styles via `style` prop
    },
});
