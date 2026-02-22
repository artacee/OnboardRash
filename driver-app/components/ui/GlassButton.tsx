/**
 * GlassButton — Floating glass pill button matching visionOS design.
 */

import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ViewStyle,
    ActivityIndicator,
} from 'react-native';
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
    const variantStyles = {
        default: {
            bg: theme.colors.glassTier1,
            text: theme.colors.textPrimary,
        },
        primary: {
            bg: 'rgba(52, 211, 153, 0.25)',
            text: '#047857',
        },
        danger: {
            bg: 'rgba(248, 113, 113, 0.25)',
            text: '#b91c1c',
        },
    };

    const v = variantStyles[variant];

    return (
        <TouchableOpacity
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onPress();
            }}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={[
                styles.button,
                { backgroundColor: v.bg, opacity: disabled ? 0.5 : 1 },
                theme.shadows.sm,
                style,
            ]}
        >
            <BlurView
                intensity={20}
                tint="light"
                style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.full, overflow: 'hidden' }]}
            />
            {loading ? (
                <ActivityIndicator size="small" color={v.text} />
            ) : (
                <>
                    {icon}
                    <Text style={[styles.text, { color: v.text }]}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing['2xl'],
        borderRadius: theme.radius.full,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.4)',
        overflow: 'hidden',
    },
    text: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.body,
        fontWeight: theme.fontWeight.headline,
    },
});
