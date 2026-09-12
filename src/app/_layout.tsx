import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { ThemeColors, Typography, Spacing, Radii } from '../constants/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const { isAuthenticated, isLoading, user, initializeAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // 1. Hydrate tokens and user profile on app launch
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // 2. Global Route Guard: react to auth state and segment changes
  useEffect(() => {
    if (isLoading) return;

    const rootSegment = segments[0] as string | undefined;
    const inAuthGroup = rootSegment === '(auth)';
    const inOnboardingGroup = rootSegment === '(onboarding)';

    if (!isAuthenticated) {
      // If user is not authenticated and not in auth screens, redirect to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // User IS authenticated
      const needsOnboarding = !user?.name;

      if (inAuthGroup) {
        // Authenticated user trying to access auth screens
        if (needsOnboarding) {
          router.replace('/(onboarding)/profile');
        } else {
          router.replace('/(app)');
        }
      } else if (inOnboardingGroup && !needsOnboarding) {
        // Onboarded user in onboarding screens
        // Allow user to proceed or redirect to app
      }
    }
  }, [isAuthenticated, isLoading, segments, user, router]);

  // Branded Splash / Loading screen while hydrating tokens
  if (isLoading) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.brandBadge, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}>
          <Text style={styles.brandEmoji}>🌿</Text>
        </View>
        <Text style={[Typography.title1, { color: theme.textPrimary, marginTop: Spacing.md }]}>
          My Wallet
        </Text>
        <Text style={[Typography.footnote, { color: theme.textSecondary, marginTop: Spacing.xs }]}>
          Securing your financial vault...
        </Text>
        <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: Spacing.xl }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  brandBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandEmoji: {
    fontSize: 36,
  },
});
