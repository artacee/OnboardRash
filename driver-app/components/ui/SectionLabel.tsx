/**
 * SectionLabel — Accent dot + uppercase section header.
 * Replaces plain Text sectionTitle across all screens.
 * Dot color matches per-screen chromatic identity.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

// Per-screen dot color presets
export const SECTION_DOT_COLORS = {
    trip:    '#7850DC',
    history: '#D4820A',
    profile: '#C43070',
    ember:   '#E07832',
};

interface SectionLabelProps {
    text: string;
    dotColor?: string;
}

export function SectionLabel({
    text,
    dotColor = SECTION_DOT_COLORS.trip,
}: SectionLabelProps) {
    return (
        <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <Text style={styles.label}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: theme.spacing.base,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    label: {
        fontFamily: theme.fonts.headline,
        fontSize: theme.fontSize.footnote,
        fontWeight: theme.fontWeight.headline,
        color: 'rgba(0, 0, 0, 0.55)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
});
