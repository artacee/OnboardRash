/**
 * GradientTitle — SVG-based gradient text heading.
 * Uses react-native-svg to render text through a linear gradient.
 * Paired with Inter_400Regular at large sizes for dramatic weight contrast.
 */

import React from 'react';
import Svg, {
    Defs,
    LinearGradient as SvgGradient,
    Stop,
    Text as SvgText,
} from 'react-native-svg';
import { theme } from '@/constants/theme';

interface GradientTitleProps {
    text: string;
    fontSize?: number;
    colors?: [string, string];
    letterSpacing?: number;
    fontFamily?: string;
    fontWeight?: string;
    /** Width multiplier per character. Increase for bolder/wider fonts. Default 0.58 (Inter Regular). */
    widthFactor?: number;
    style?: object;
}

// Per-screen gradient presets (matched to chromatic tab bar)
export const GRADIENT_PRESETS = {
    trip:    ['#7850DC', '#4A90D9'] as [string, string],   // violet → blue
    history: ['#D4820A', '#B85C0A'] as [string, string],   // amber → burnt orange
    profile: ['#C43070', '#8B2FC4'] as [string, string],   // rose → violet
    auth:    ['#7850DC', '#D050A0'] as [string, string],   // violet → pink
};

export function GradientTitle({
    text,
    fontSize = theme.fontSize.title1,
    colors = GRADIENT_PRESETS.auth,
    letterSpacing = -1.5,
    fontFamily = 'Inter_400Regular',
    fontWeight = '400',
    widthFactor = 0.58,
    style,
}: GradientTitleProps) {
    // Conservative width estimate: ~widthFactor × fontSize × charCount + padding
    const estimatedWidth = Math.ceil(fontSize * text.length * widthFactor) + 24;
    const height = Math.ceil(fontSize * 1.35);

    return (
        <Svg width={estimatedWidth} height={height} style={style}>
            <Defs>
                <SvgGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="20%">
                    <Stop offset="0%" stopColor={colors[0]} stopOpacity="1" />
                    <Stop offset="100%" stopColor={colors[1]} stopOpacity="1" />
                </SvgGradient>
            </Defs>
            <SvgText
                fill="url(#titleGrad)"
                fontFamily={fontFamily}
                fontSize={fontSize}
                fontWeight={fontWeight}
                letterSpacing={letterSpacing}
                x="0"
                y={fontSize}
            >
                {text}
            </SvgText>
        </Svg>
    );
}
