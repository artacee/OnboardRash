/**
 * GlassInput — Glass-morphism input field matching visionOS design.
 */

import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '@/constants/theme';

interface GlassInputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export function GlassInput({ label, error, style, ...props }: GlassInputProps) {
    return (
        <View style={styles.wrapper}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputContainer, error && styles.inputError]}>
                <BlurView
                    intensity={12}
                    tint="light"
                    style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.md, overflow: 'hidden' }]}
                />
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor={theme.colors.textTertiary}
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: theme.spacing.base,
    },
    label: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.headline,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    inputContainer: {
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.glassTier2,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.4)',
        overflow: 'hidden',
    },
    inputError: {
        borderWidth: 1,
        borderColor: theme.colors.danger,
    },
    input: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.body,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textPrimary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.base,
        position: 'relative',
        zIndex: 1,
    },
    errorText: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        color: theme.colors.danger,
        marginTop: theme.spacing.xs,
    },
});
