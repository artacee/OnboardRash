/**
 * PressableScale — Universal spring-press wrapper for any tappable element.
 *
 * Adds a satisfying spring scale-down on press + optional haptic feedback.
 * Drop-in replacement for TouchableOpacity with physical feel.
 */

import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';

interface PressableScaleProps {
    children: React.ReactNode;
    onPress?: () => void;
    onLongPress?: () => void;
    scaleTo?: number;
    haptic?: boolean;
    hapticStyle?: Haptics.ImpactFeedbackStyle | 'light' | 'medium' | 'heavy';
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    activeOpacity?: number;
}

export function PressableScale({
    children,
    onPress,
    onLongPress,
    scaleTo = 0.96,
    haptic = true,
    hapticStyle = Haptics.ImpactFeedbackStyle.Light,
    disabled = false,
    style,
    activeOpacity,
}: PressableScaleProps) {
    const scale = useSharedValue(1);

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        ...(activeOpacity !== undefined && scale.value < 1
            ? { opacity: activeOpacity }
            : {}),
    }));

    const handlePressIn = () => {
        scale.value = withSpring(scaleTo, theme.spring.press);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, theme.spring.press);
    };

    const handlePress = () => {
        if (haptic) {
            const styleMap: Record<string, Haptics.ImpactFeedbackStyle> = {
                light: Haptics.ImpactFeedbackStyle.Light,
                medium: Haptics.ImpactFeedbackStyle.Medium,
                heavy: Haptics.ImpactFeedbackStyle.Heavy,
            };
            const resolved = typeof hapticStyle === 'string' && hapticStyle in styleMap
                ? styleMap[hapticStyle]
                : (hapticStyle as Haptics.ImpactFeedbackStyle);
            Haptics.impactAsync(resolved);
        }
        onPress?.();
    };

    return (
        <Animated.View style={[animStyle, style]}>
            <Pressable
                onPress={handlePress}
                onLongPress={onLongPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}
