import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    // Hydrate token & auth session on app startup
    initializeAuth();
  }, [initializeAuth]);

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colorScheme === 'dark' ? '#090D0C' : '#F8FAF9',
          },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </SafeAreaProvider>
  );
}
