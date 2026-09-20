import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useColorScheme,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from '@expo-google-fonts/cairo';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';
import { ThemeColors, Typography, Spacing } from '../constants/theme';
import { Strings } from '../constants/strings';

// 1. Maintain consistent base layout in native Yoga (prevent native double-flipping)
if (I18nManager.isRTL) {
  I18nManager.allowRTL(false);
  I18nManager.forceRTL(false);
}

// Prevent splash screen from auto-hiding until fonts, auth, and language state are ready
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const { isAuthenticated, isLoading, user, initializeAuth } = useAuthStore();
  const { initializeLanguage, isLoading: isLanguageLoading } = useLanguageStore();
  const segments = useSegments();
  const router = useRouter();

  // 2. Load Cairo Google Fonts
  const [fontsLoaded, fontError] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  // 3. Hydrate tokens and language preference on app launch
  useEffect(() => {
    initializeAuth();
    initializeLanguage();
  }, [initializeAuth, initializeLanguage]);

  // 4. Hide splash screen when fonts, auth, and language are ready
  useEffect(() => {
    if ((fontsLoaded || fontError) && !isLoading && !isLanguageLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, isLoading, isLanguageLoading]);

  // 5. Global Route Guard: react to auth state and segment changes
  useEffect(() => {
    if (isLoading || isLanguageLoading || (!fontsLoaded && !fontError)) return;

    const rootSegment = segments[0] as string | undefined;
    const subSegment = segments[1] as string | undefined;
    const inAuthGroup = rootSegment === '(auth)';
    const inOnboardingGroup = rootSegment === '(onboarding)';

    if (!isAuthenticated) {
      // If user is not authenticated and not in auth screens, redirect to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      // User IS authenticated
      const needsProfile = !user?.name;
      const needsFinancial = !user?.default_monthly_budget;

      if (needsProfile || needsFinancial) {
        // If user hasn't completed onboarding and is outside onboarding group, route to proper step
        if (!inOnboardingGroup) {
          if (needsProfile) {
            router.replace('/(onboarding)/profile');
          } else {
            router.replace('/(onboarding)/financial');
          }
        } else if (needsProfile && subSegment === 'financial') {
          // If name is not set, user cannot skip step 1 to step 2
          router.replace('/(onboarding)/profile');
        }
      } else if (inAuthGroup || inOnboardingGroup) {
        // If on OTP screen, let otp.tsx handle the timed success transition
        if (subSegment === 'otp') {
          return;
        }
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoading, fontsLoaded, fontError, segments, user, router]);

  // Branded Splash / Loading screen while hydrating tokens and loading fonts
  if (isLoading || (!fontsLoaded && !fontError)) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: theme.background }]}>
        <View style={[styles.brandBadge, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}>
          <Text style={styles.brandEmoji}>💸</Text>
        </View>
        <Text style={[Typography.title1, { color: theme.textPrimary, marginTop: Spacing.md }]}>
          {Strings.common.appName}
        </Text>
        <Text style={[Typography.footnote, { color: theme.textSecondary, marginTop: Spacing.xs }]}>
          {Strings.common.hydratingVault}
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
        <Stack.Screen name="(app)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
        <Stack.Screen name="(onboarding)" options={{ animation: 'slide_from_right' }} />
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
