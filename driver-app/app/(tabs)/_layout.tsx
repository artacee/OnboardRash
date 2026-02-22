/**
 * Tab Layout — Glass tab bar with animated active indicator pill.
 */

import { Tabs } from 'expo-router';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/theme';

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={tabIconStyles.wrapper}>
      {focused && <View style={[tabIconStyles.pill, { backgroundColor: `${theme.colors.textPrimary}08` }]} />}
      <Ionicons name={name as any} size={22} color={color} />
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 30,
  },
  pill: {
    position: 'absolute',
    width: 48,
    height: 30,
    borderRadius: 15,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.textPrimary,
        tabBarInactiveTintColor: theme.colors.textQuaternary,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.headline,
          fontSize: 11,
          fontWeight: theme.fontWeight.headline,
          marginTop: 2,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          height: 72,
          borderRadius: theme.radius.xxl,
          backgroundColor: theme.colors.glassTier0,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.45)',
          paddingBottom: 8,
          paddingTop: 8,
          ...theme.shadows.lg,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={64}
            tint="light"
            style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.xxl, overflow: 'hidden' }]}
          />
        ),
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trip',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="car" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="time" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
