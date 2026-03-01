/**
 * ShimmerPlaceholder — Skeleton loading with sweeping shimmer effect.
 *
 * Replaces ActivityIndicator with contextual skeleton shapes that match
 * the layout they're loading. Uses expo-linear-gradient + reanimated.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/constants/theme';

interface ShimmerPlaceholderProps {
    width: number | `${number}%`;
    height: number;
    borderRadius?: number;
    style?: StyleProp<ViewStyle>;
}

export function ShimmerPlaceholder({
    width,
    height,
    borderRadius = theme.radius.md,
    style,
}: ShimmerPlaceholderProps) {
    const translateX = useSharedValue(-1);

    useEffect(() => {
        translateX.value = withRepeat(
            withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
            -1,
            false,
        );
    }, []);

    const shimmerStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value * 200 }],
    }));

    return (
        <View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: theme.colors.shimmerBase,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View style={[StyleSheet.absoluteFill, shimmerStyle]}>
                <LinearGradient
                    colors={[
                        'transparent',
                        theme.colors.shimmerHighlight,
                        'transparent',
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={[StyleSheet.absoluteFill, { width: 200 }]}
                />
            </Animated.View>
        </View>
    );
}

/* ─── Preset skeleton groups for common layouts ─── */

export function ShimmerScoreArc({ size = 150 }: { size?: number }) {
    return (
        <View style={{ alignItems: 'center' }}>
            <ShimmerPlaceholder width={size} height={size} borderRadius={size / 2} />
        </View>
    );
}

export function ShimmerButton({ width = 200 }: { width?: number }) {
    return (
        <View style={{ alignItems: 'center' }}>
            <ShimmerPlaceholder width={width} height={48} borderRadius={theme.radius.full} />
        </View>
    );
}

export function ShimmerText({
    width = 160,
    height = 16,
}: {
    width?: number | `${number}%`;
    height?: number;
}) {
    return <ShimmerPlaceholder width={width} height={height} borderRadius={theme.radius.xs} />;
}

export function ShimmerCard({ height = 100 }: { height?: number }) {
    return (
        <ShimmerPlaceholder
            width="100%"
            height={height}
            borderRadius={theme.radius.xl}
            style={{ marginBottom: theme.spacing.md }}
        />
    );
}

export function ShimmerStatusRow() {
    return (
        <View style={shimmerStyles.statusRow}>
            <ShimmerPlaceholder width={36} height={36} borderRadius={12} />
            <View style={{ flex: 1, gap: 6 }}>
                <ShimmerPlaceholder width={80} height={12} borderRadius={4} />
                <ShimmerPlaceholder width={120} height={14} borderRadius={4} />
            </View>
        </View>
    );
}

export function HomeSkeleton() {
    return (
        <View style={shimmerStyles.container}>
            {/* Greeting */}
            <View style={{ marginBottom: theme.spacing.xl }}>
                <ShimmerText width={180} height={28} />
                <ShimmerText width={120} height={16} />
            </View>

            {/* Trip card */}
            <ShimmerPlaceholder
                width="100%"
                height={280}
                borderRadius={theme.radius.xxxl}
                style={{ marginBottom: theme.spacing.xl }}
            />

            {/* Status card */}
            <ShimmerPlaceholder
                width="100%"
                height={200}
                borderRadius={theme.radius.xl}
            />
        </View>
    );
}

export function HistorySkeleton() {
    return (
        <View style={shimmerStyles.container}>
            <View style={{ marginBottom: theme.spacing.xl }}>
                <ShimmerText width={160} height={28} />
                <ShimmerText width={100} height={16} />
            </View>
            <ShimmerCard height={110} />
            <ShimmerCard height={110} />
            <ShimmerCard height={110} />
        </View>
    );
}

export function ProfileSkeleton() {
    return (
        <View style={shimmerStyles.container}>
            <View style={{ marginBottom: theme.spacing.xl }}>
                <ShimmerText width={100} height={28} />
            </View>
            {/* Avatar + name */}
            <View style={{ alignItems: 'center', marginBottom: theme.spacing.xl }}>
                <ShimmerPlaceholder width={84} height={84} borderRadius={42} />
                <ShimmerText width={140} height={20} />
                <ShimmerText width={100} height={14} />
            </View>
            <ShimmerCard height={120} />
            <ShimmerCard height={180} />
        </View>
    );
}

const shimmerStyles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing.base,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.base,
    },
});
