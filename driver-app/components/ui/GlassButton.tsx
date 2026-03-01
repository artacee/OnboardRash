/**
 * GlassButton — Premium floating glass pill button.
 *
 * Features:
 * - Deep spring press (0.92 scale)
 * - White flash overlay on press
 * - Full perimeter glass border
 * - Shadow reduction on press for "pushed into surface" feel
 */

import React from 'react';
import {
    Pressable,
    Text,
    StyleSheet,
    ViewStyle,
    ActivityIndicator,
    Platform,
    View,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';

interface GlassButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'default' | 'primary' | 'danger';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
    icon?: React.ReactNode;
}

export function GlassButton({
    title,
    onPress,
    variant = 'default',
    disabled = false,
    loading = false,
    style,
    icon,
}: GlassButtonProps) {
    const scale = useSharedValue(1);
    const flashOpacity = useSharedValue(0);

    const variantStyles = {
        default: {
            bg: theme.colors.glassTier1,
            text: theme.colors.textPrimary,
        },
        primary: {
            bg: theme.colors.primaryBg,
            text: theme.colors.safeText,
        },
        danger: {
            bg: theme.colors.dangerBtnBg,
            text: theme.colors.dangerText,
        },
    };

    const v = variantStyles[variant];

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const flashStyle = useAnimatedStyle(() => ({
        opacity: flashOpacity.value,
    }));

    const isAndroid = Platform.OS === 'android';

    const handlePressIn = () => {
        scale.value = withSpring(0.92, theme.spring.press);
        flashOpacity.value = withTiming(0.18, { duration: 80 });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, theme.spring.press);
        flashOpacity.value = withTiming(0, { duration: 200 });
    };

    return (
        <Animated.View style={[animStyle, style]}>
            <Pressable
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onPress();
                }}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || loading}
                style={[
                    styles.button,
                    { backgroundColor: v.bg, opacity: disabled ? 0.5 : 1 },
                    // No elevation on Android — creates compositing layer same as overflow:hidden
                    isAndroid ? {} : theme.shadows.sm,
                ]}
            >
                {/* BlurView — iOS only; on Android it forces a compositing buffer */}
                {!isAndroid && (
                    <BlurView
                        intensity={30}
                        tint="light"
                        style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.full, overflow: 'hidden' }]}
                    />
                )}
                {/* White flash overlay */}
                <Animated.View
                    style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: theme.colors.pressOverlay, borderRadius: theme.radius.full },
                        flashStyle,
                    ]}
                    pointerEvents="none"
                />
                {loading ? (
                    <ActivityIndicator size="small" color={v.text} />
                ) : (
                    <View style={styles.content}>
                        {icon}
                        <Text style={[styles.text, { color: v.text }]}>{title}</Text>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing['2xl'],
        borderRadius: theme.radius.full,
        borderWidth: 1,
        borderTopColor: theme.colors.glassBorderLight,
        borderLeftColor: theme.colors.glassBorder,
        borderRightColor: theme.colors.glassBorder,
        borderBottomColor: theme.colors.glassBorderDark,
        // No overflow:hidden — on Android it isolates compositing against white
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    text: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.body,
        fontWeight: theme.fontWeight.headline,
    },
});
