/**
 * Tab Layout — Bottom tab navigator for authenticated screens.
 * 
 * Glass-morphism tab bar matching visionOS aesthetic.
 */

import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.textPrimary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: theme.fonts.headline,
          fontSize: 11,
          fontWeight: theme.fontWeight.headline,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          height: 70,
          borderRadius: theme.radius.xxl,
          backgroundColor: theme.colors.glassTier0,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.4)',
          paddingBottom: 8,
          paddingTop: 8,
          ...theme.shadows.lg,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={60}
            tint="light"
            style={[StyleSheet.absoluteFill, { borderRadius: theme.radius.xxl, overflow: 'hidden' }]}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Trip',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
