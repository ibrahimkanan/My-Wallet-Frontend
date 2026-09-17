import React from 'react';
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="wallets" options={{ headerShown: false }} />
      <Stack.Screen name="categories" options={{ headerShown: false }} />
      <Stack.Screen
        name="transaction/new"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
