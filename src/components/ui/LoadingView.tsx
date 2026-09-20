import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { ThemeColors, Typography, Spacing } from '../../constants/theme';
import { Strings } from '../../constants/strings';

interface LoadingViewProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export function LoadingView({
  message = Strings.common.loading,
  size = 'large',
  color,
}: LoadingViewProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const indicatorColor = color || theme.primary;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={indicatorColor} />
      {message ? (
        <Text style={[Typography.caption, styles.message, { color: theme.textSecondary }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  message: {
    marginTop: Spacing.sm,
  },
});
