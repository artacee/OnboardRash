/**
 * AnimatedEntry — Staggered fade-up entrance animation wrapper.
 * 
 * Wraps any component to give it a smooth entrance with configurable delay.
 * Usage: <AnimatedEntry delay={100}><GlassCard>...</GlassCard></AnimatedEntry>
 */

import React from 'react';
import Animated, {
    FadeInDown,
    FadeInUp,
    SlideInDown,
} from 'react-native-reanimated';

interface AnimatedEntryProps {
    children: React.ReactNode;
    delay?: number;
    direction?: 'up' | 'down';
    distance?: number;
}

export function AnimatedEntry({
    children,
    delay = 0,
    direction = 'up',
    distance = 24,
}: AnimatedEntryProps) {
    const entering = direction === 'up'
        ? FadeInDown.delay(delay).duration(600).springify().damping(18).stiffness(120)
        : FadeInUp.delay(delay).duration(600).springify().damping(18).stiffness(120);

    return (
        <Animated.View entering={entering}>
            {children}
        </Animated.View>
    );
}
