import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { ThemeColors, Typography, Radii, Spacing } from '../../constants/theme';

export interface ErrorBannerProps {
  message: string | null;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export function ErrorBanner({
  message,
  onDismiss,
  variant = 'error',
}: ErrorBannerProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  if (!message) return null;

  const getColors = () => {
    switch (variant) {
      case 'warning':
        return {
          bg: theme.warningBg,
          border: theme.warningBorder,
          text: theme.warning,
          icon: '⚠️',
        };
      case 'info':
        return {
          bg: theme.primaryMuted,
          border: theme.border,
          text: theme.primary,
          icon: 'ℹ️',
        };
      case 'error':
      default:
        return {
          bg: theme.expenseBg,
          border: theme.expenseBorder,
          text: theme.expense,
          icon: '⚠️',
        };
    }
  };

  const colors = getColors();

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
      ]}
    >
      <Text style={styles.icon}>{colors.icon}</Text>
      <Text style={[Typography.callout, styles.message, { color: colors.text }]}>
        {message}
      </Text>
      {onDismiss ? (
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={[Typography.caption, { color: colors.text, fontWeight: '700' }]}>
            ✕
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  icon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  message: {
    flex: 1,
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 18,
  },
  dismissButton: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    marginLeft: Spacing.xs,
  },
});
