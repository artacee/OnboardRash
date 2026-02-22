/**
 * ScoreArc — Apple Watch Activity Ring style animated score display.
 * 
 * SVG arc that sweeps from 0→score with gradient stroke and ambient glow.
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { theme } from '@/constants/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreArcProps {
    score: number;
    size?: number;
    strokeWidth?: number;
}

export function ScoreArc({ score, size = 140, strokeWidth = 8 }: ScoreArcProps) {
    const center = size / 2;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedProgress = useSharedValue(0);

    useEffect(() => {
        animatedProgress.value = withDelay(
            300,
            withTiming(score / 100, {
                duration: 1200,
                easing: Easing.out(Easing.cubic),
            })
        );
    }, [score]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - animatedProgress.value),
    }));

    const scoreColor =
        score >= 80 ? theme.colors.safe :
            score >= 50 ? theme.colors.warning :
                theme.colors.danger;

    const gradientEnd =
        score >= 80 ? '#6ee7b7' :
            score >= 50 ? '#fde68a' :
                '#fca5a5';

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Ambient glow */}
            <View
                style={[
                    styles.glow,
                    {
                        width: size + 20,
                        height: size + 20,
                        borderRadius: (size + 20) / 2,
                        backgroundColor: scoreColor,
                        opacity: 0.12,
                    },
                ]}
            />

            <Svg width={size} height={size}>
                <Defs>
                    <LinearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={scoreColor} />
                        <Stop offset="100%" stopColor={gradientEnd} />
                    </LinearGradient>
                </Defs>

                {/* Background track */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="rgba(0, 0, 0, 0.04)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Animated score arc */}
                <AnimatedCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="url(#scoreGrad)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${center}, ${center}`}
                />
            </Svg>

            {/* Score text overlay */}
            <View style={styles.textOverlay}>
                <Text style={[styles.scoreValue, { color: scoreColor }]}>
                    {Math.round(score)}
                </Text>
                <Text style={styles.scoreLabel}>Score</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    glow: {
        position: 'absolute',
    },
    textOverlay: {
        position: 'absolute',
        alignItems: 'center',
    },
    scoreValue: {
        fontFamily: theme.fonts.display,
        fontSize: 38,
        fontWeight: theme.fontWeight.display,
        letterSpacing: -1,
    },
    scoreLabel: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
        marginTop: -4,
    },
});
