/**
 * AnimatedEntry — Staggered entrance animation wrapper with multiple types.
 *
 * Types:
 * - 'fade-up' (default) — classic fade + slide from below
 * - 'fade-down' — fade + slide from above
 * - 'slide-left' — fade + slide from right
 * - 'slide-right' — fade + slide from left
 * - 'scale' — zoom in with spring bounce
 * - 'fade' — simple opacity fade
 */

import React from 'react';
import Animated, {
    FadeInDown,
    FadeInUp,
    FadeInRight,
    FadeInLeft,
    FadeIn,
} from 'react-native-reanimated';

type AnimationType = 'fade-up' | 'fade-down' | 'slide-left' | 'slide-right' | 'scale' | 'fade';

interface AnimatedEntryProps {
    children: React.ReactNode;
    delay?: number;
    direction?: 'up' | 'down'; // Legacy compat
    type?: AnimationType;
}

const SPRING_D = 26;
const SPRING_S = 200;
const DURATION = 420;
const Y_OFFSET = 14;   // px — max vertical travel for slide variants

export function AnimatedEntry({
    children,
    delay = 0,
    direction = 'up',
    type,
}: AnimatedEntryProps) {
    // If `type` is explicitly set, use it. Otherwise fall back to `direction` for compat.
    const resolvedType: AnimationType = type ?? (direction === 'down' ? 'fade-down' : 'fade-up');

    const getEntering = () => {
        switch (resolvedType) {
            case 'fade-up':
                return FadeInDown.delay(delay).duration(DURATION).springify().damping(SPRING_D).stiffness(SPRING_S)
                    .withInitialValues({ transform: [{ translateY: Y_OFFSET }], opacity: 0 });
            case 'fade-down':
                return FadeInUp.delay(delay).duration(DURATION).springify().damping(SPRING_D).stiffness(SPRING_S)
                    .withInitialValues({ transform: [{ translateY: -Y_OFFSET }], opacity: 0 });
            case 'slide-left':
                return FadeInRight.delay(delay).duration(DURATION).springify().damping(SPRING_D).stiffness(SPRING_S)
                    .withInitialValues({ transform: [{ translateX: 20 }], opacity: 0 });
            case 'slide-right':
                return FadeInLeft.delay(delay).duration(DURATION).springify().damping(SPRING_D).stiffness(SPRING_S)
                    .withInitialValues({ transform: [{ translateX: -20 }], opacity: 0 });
            case 'scale':
                // Gentle lift + fade — less jarring than ZoomIn
                return FadeInDown.delay(delay).duration(DURATION).springify().damping(SPRING_D).stiffness(SPRING_S)
                    .withInitialValues({ transform: [{ translateY: 8 }, { scale: 0.97 }], opacity: 0 });
            case 'fade':
                return FadeIn.delay(delay).duration(DURATION);
            default:
                return FadeInDown.delay(delay).duration(DURATION).springify().damping(SPRING_D).stiffness(SPRING_S)
                    .withInitialValues({ transform: [{ translateY: Y_OFFSET }], opacity: 0 });
        }
    };

    return (
        <Animated.View entering={getEntering()}>
            {children}
        </Animated.View>
    );
}
