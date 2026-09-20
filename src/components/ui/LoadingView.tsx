import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, useColorScheme } from 'react-native';
import { ThemeColors, Typography, Spacing } from '../../constants/theme';
import { useLanguage } from '../../i18n';

interface LoadingViewProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export function LoadingView({
  message,
  size = 'large',
  color,
}: LoadingViewProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { strings } = useLanguage();
  const indicatorColor = color || theme.primary;
  const displayMessage = message ?? strings.common.loading;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={indicatorColor} />
      {displayMessage ? (
        <Text style={[Typography.caption, styles.message, { color: theme.textSecondary }]}>
          {displayMessage}
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
