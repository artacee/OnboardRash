/**
 * ScoreArc — Apple Watch Activity Ring style animated score display.
 *
 * Features:
 * - SVG arc that sweeps 0→score with gradient stroke + spring bounce
 * - Animated counting number (0 → score) via CountingText
 * - Breathing ambient glow with pulsing opacity
 * - Outer decorative glow ring
 * - Tick marks at every 10th percentile on the track
 * - Haptic feedback when animation settles
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    useAnimatedStyle,
    withDelay,
    withSpring,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';
import { CountingText } from './CountingText';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreArcProps {
    score: number;
    size?: number;
    strokeWidth?: number;
}

export function ScoreArc({ score, size = 140, strokeWidth = 10 }: ScoreArcProps) {
    const center = size / 2;
    const radius = (size - strokeWidth * 2) / 2;
    const circumference = 2 * Math.PI * radius;

    const animatedProgress = useSharedValue(0);
    const glowPulse = useSharedValue(0.12);

    useEffect(() => {
        animatedProgress.value = withDelay(
            300,
            withSpring(score / 100, {
                damping: 14,
                stiffness: 80,
                mass: 1,
            })
        );

        // Breathing glow
        glowPulse.value = withDelay(
            600,
            withRepeat(
                withSequence(
                    withTiming(0.28, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.12, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
                ),
                -1,
                true,
            ),
        );

        // Haptic when score arrives
        const timer = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 600);
        return () => clearTimeout(timer);
    }, [score]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - animatedProgress.value),
    }));

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glowPulse.value,
    }));

    const scoreColor =
        score >= 80 ? theme.colors.safe :
            score >= 50 ? theme.colors.warning :
                theme.colors.danger;

    const gradientEnd =
        score >= 80 ? theme.colors.gradientEndSafe :
            score >= 50 ? theme.colors.gradientEndWarning :
                theme.colors.gradientEndDanger;

    // Generate tick marks at every 10%
    const ticks = Array.from({ length: 10 }, (_, i) => {
        const angle = ((i * 36) - 90) * (Math.PI / 180);
        const innerR = radius - strokeWidth / 2 - 2;
        const outerR = radius + strokeWidth / 2 + 2;
        return {
            x1: center + innerR * Math.cos(angle),
            y1: center + innerR * Math.sin(angle),
            x2: center + outerR * Math.cos(angle),
            y2: center + outerR * Math.sin(angle),
        };
    });

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Ambient glow — breathing colored shadow/bg */}
            <Animated.View
                style={[
                    styles.glow,
                    {
                        width: size + 40,
                        height: size + 40,
                        borderRadius: (size + 40) / 2,
                        backgroundColor: scoreColor,
                    },
                    Platform.OS === 'ios' && {
                        shadowColor: scoreColor,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.4,
                        shadowRadius: 40,
                    },
                    glowStyle,
                ]}
            />

            <Svg width={size} height={size}>
                <Defs>
                    <LinearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={scoreColor} />
                        <Stop offset="100%" stopColor={gradientEnd} />
                    </LinearGradient>
                </Defs>

                {/* Outer decorative glow ring */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius + 6}
                    stroke={scoreColor}
                    strokeWidth={1.5}
                    fill="none"
                    opacity={0.08}
                />

                {/* Background track */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="rgba(0, 0, 0, 0.04)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />

                {/* Tick marks */}
                {ticks.map((tick, i) => (
                    <Line
                        key={i}
                        x1={tick.x1}
                        y1={tick.y1}
                        x2={tick.x2}
                        y2={tick.y2}
                        stroke="rgba(0, 0, 0, 0.06)"
                        strokeWidth={1}
                    />
                ))}

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

            {/* Score text overlay — animated counting */}
            <View style={styles.textOverlay}>
                <CountingText
                    value={score}
                    delay={300}
                    useSpring
                    style={[styles.scoreValue, { color: scoreColor }]}
                />
                <Animated.Text style={styles.scoreLabel}>Score</Animated.Text>
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
        textAlign: 'center',
        width: 80,
    },
    scoreLabel: {
        fontFamily: theme.fonts.body,
        fontSize: theme.fontSize.caption,
        fontWeight: theme.fontWeight.body,
        color: theme.colors.textTertiary,
        marginTop: -4,
    },
});
