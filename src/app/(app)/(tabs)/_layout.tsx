import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, FontFamilies, Radii } from '../../../constants/theme';
import { Strings } from '../../../constants/strings';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: {
          fontFamily: FontFamilies.medium,
          fontSize: 12,
        },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: Strings.tabs.home,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />

      {/* Transactions Tab */}
      <Tabs.Screen
        name="transactions"
        options={{
          title: Strings.tabs.transactions,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'receipt' : 'receipt-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />

      {/* Budgets Tab */}
      <Tabs.Screen
        name="budgets"
        options={{
          title: Strings.tabs.budgets,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'pie-chart' : 'pie-chart-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />

      {/* Charts Tab */}
      <Tabs.Screen
        name="charts"
        options={{
          title: Strings.tabs.charts,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />

      {/* Profile Tab */}
      <Tabs.Screen
        name="profile"
        options={{
          title: Strings.tabs.profile,
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size || 22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
