/**
 * Tab Layout — Premium glass tab bar with animated sliding indicator pill.
 *
 * Features:
 * - Custom tabBar for spring-animated pill that slides between tabs
 * - Icon scale spring on press
 * - Outline ↔ filled icon morph
 * - Glass blur backdrop
 * - Full-perimeter glass border
 */

import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Pressable, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    interpolateColor,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

const TAB_NAMES = ['home', 'history', 'profile'] as const;
const TAB_ICONS: Record<string, string> = {
    home: 'car',
    history: 'time',
    profile: 'person',
};
const TAB_LABELS: Record<string, string> = {
    home: 'Trip',
    history: 'History',
    profile: 'Profile',
};

// Per-tab signature accent colors
const TAB_COLORS: Record<string, string> = {
    home:    '#7850DC', // Violet — Trip
    history: '#D4820A', // Amber  — History
    profile: '#C43070', // Rose   — Profile
};

// Semi-transparent pill tint per tab
const TAB_PILL_COLORS: Record<string, string> = {
    home:    'rgba(120, 80, 220, 0.18)',
    history: 'rgba(212, 130, 10,  0.18)',
    profile: 'rgba(196, 48, 112, 0.18)',
};

const ROUTE_NAMES = ['home', 'history', 'profile'];

function CustomTabBar({ state, descriptors, navigation }: any) {
    const insets = useSafeAreaInsets();
    const indicatorX = useSharedValue(0);
    const tabIndex  = useSharedValue(state.index);
    const tabWidths   = React.useRef<number[]>([]);
    const tabXPositions = React.useRef<number[]>([]);

    useEffect(() => {
        if (tabXPositions.current[state.index] !== undefined) {
            indicatorX.value = withSpring(tabXPositions.current[state.index], theme.spring.snappy);
        }
        tabIndex.value = withTiming(state.index, { duration: 260 });
    }, [state.index]);

    const indicatorStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: indicatorX.value }],
        backgroundColor: interpolateColor(
            tabIndex.value,
            [0, 1, 2],
            [
                TAB_PILL_COLORS['home'],
                TAB_PILL_COLORS['history'],
                TAB_PILL_COLORS['profile'],
            ]
        ),
    }));

    const handleTabLayout = (index: number) => (e: LayoutChangeEvent) => {
        const { x, width } = e.nativeEvent.layout;
        tabWidths.current[index] = width;
        tabXPositions.current[index] = x;
        // Initialize indicator position for active tab
        if (index === state.index) {
            indicatorX.value = x;
        }
    };

    const isAndroid = Platform.OS === 'android';

    return (
        <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
            <View style={[styles.tabBarInner, isAndroid ? styles.tabBarInnerAndroid : styles.tabBarInnerIOS]}>
                {/* Blur backdrop — iOS only; overflow:hidden on parent clips it cleanly */}
                {!isAndroid && (
                    <BlurView
                        intensity={80}
                        tint="light"
                        style={StyleSheet.absoluteFill}
                    />
                )}

                {/* Animated sliding indicator pill */}
                <Animated.View style={[styles.indicator, indicatorStyle]} />

                {/* Tab items */}
                {state.routes.map((route: any, index: number) => {
                    const focused = state.index === index;
                    const iconName = TAB_ICONS[route.name] || 'ellipse';
                    const label = TAB_LABELS[route.name] || route.name;
                    const tabColor = TAB_COLORS[route.name] || theme.colors.textPrimary;

                    return (
                        <TabItem
                            key={route.key}
                            focused={focused}
                            iconName={iconName}
                            label={label}
                            tabColor={tabColor}
                            onLayout={handleTabLayout(index)}
                            onPress={() => {
                                const event = navigation.emit({
                                    type: 'tabPress',
                                    target: route.key,
                                    canPreventDefault: true,
                                });
                                if (!focused && !event.defaultPrevented) {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    navigation.navigate(route.name);
                                }
                            }}
                        />
                    );
                })}
            </View>
        </View>
    );
}

function TabItem({
    focused,
    iconName,
    label,
    tabColor,
    onLayout,
    onPress,
}: {
    focused: boolean;
    iconName: string;
    label: string;
    tabColor: string;
    onLayout: (e: LayoutChangeEvent) => void;
    onPress: () => void;
}) {
    const iconScale = useSharedValue(1);

    const iconAnimStyle = useAnimatedStyle(() => ({
        transform: [{ scale: iconScale.value }],
    }));

    const handlePressIn = () => {
        iconScale.value = withSpring(1.22, { damping: 10, stiffness: 320 });
    };

    const handlePressOut = () => {
        iconScale.value = withSpring(1, { damping: 14, stiffness: 200 });
    };

    const realIcon = focused ? iconName : `${iconName}-outline`;
    const color    = focused ? tabColor : theme.colors.textQuaternary;
    const iconSize = focused ? 25 : 21;

    return (
        <Pressable
            style={styles.tabItem}
            onLayout={onLayout}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            <Animated.View style={[styles.tabIconWrapper, iconAnimStyle]}>
                <Ionicons name={realIcon as any} size={iconSize} color={color} />
            </Animated.View>
            <Text style={[
                styles.tabLabel,
                { color },
                focused && styles.tabLabelActive,
            ]}>{label}</Text>
        </Pressable>
    );
}

export default function TabLayout() {
    return (
        <Tabs
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tabs.Screen name="home" />
            <Tabs.Screen name="history" />
            <Tabs.Screen name="profile" />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
        paddingTop: 0,
    },
    tabBarInner: {
        flexDirection: 'row',
        height: 68,
        borderRadius: theme.radius.xxl,
        borderWidth: 1,
        borderTopColor: theme.colors.glassBorder,
        borderLeftColor: theme.colors.glassBorder,
        borderRightColor: theme.colors.glassBorder,
        borderBottomColor: theme.colors.glassBorderDark,
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    tabBarInnerIOS: {
        backgroundColor: theme.colors.glassTier0,
        overflow: 'hidden',
        ...theme.shadows.lg,
    },
    tabBarInnerAndroid: {
        backgroundColor: theme.colors.glassTier0Android,
        // No overflow:hidden, no elevation — prevents white compositing buffer on Android
    },
    indicator: {
        position: 'absolute',
        width: `${100 / 3}%`,
        height: 36,
        borderRadius: 18,
        top: 8,
        left: 0,
        // backgroundColor is driven by interpolateColor in useAnimatedStyle
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    tabIconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 28,
    },
    tabLabel: {
        fontFamily: theme.fonts.headline,
        fontSize: 10,
        fontWeight: theme.fontWeight.headline,
        marginTop: 2,
        opacity: 0.6,
    },
    tabLabelActive: {
        fontSize: 10.5,
        opacity: 1,
        letterSpacing: 0.1,
    },
});
