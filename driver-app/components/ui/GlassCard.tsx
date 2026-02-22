/**
 * GlassCard — Tier 1 Glass component matching visionOS design system.
 * 
 * Frosted glass card with BlurView backdrop, specular top edge,
 * and shadow elevation. Used throughout the app for content containers.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '@/constants/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    tier?: 0 | 1 | 2;
    noPadding?: boolean;
}

export function GlassCard({ children, style, tier = 1, noPadding = false }: GlassCardProps) {
    const bgColors = {
        0: theme.colors.glassTier0,
        1: theme.colors.glassTier1,
        2: theme.colors.glassTier2,
    };

    const radii = {
        0: theme.radius.xxxl,
        1: theme.radius.xl,
        2: theme.radius.lg,
    };

    return (
        <View
            style={[
                styles.container,
                {
                    borderRadius: radii[tier],
                    backgroundColor: bgColors[tier],
                },
                theme.shadows.md,
                !noPadding && styles.padding,
                style,
            ]}
        >
            <BlurView
                intensity={tier === 0 ? 60 : tier === 1 ? 24 : 12}
                tint="light"
                style={[StyleSheet.absoluteFill, { borderRadius: radii[tier], overflow: 'hidden' }]}
            />
            {/* Specular top edge */}
            <View
                style={[
                    styles.specularEdge,
                    { borderTopLeftRadius: radii[tier], borderTopRightRadius: radii[tier] },
                ]}
            />
            {/* Content */}
            <View style={styles.content}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.4)',
    },
    padding: {
        padding: theme.spacing.xl,
    },
    specularEdge: {
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    content: {
        position: 'relative',
        zIndex: 1,
    },
});
