import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii } from '../../constants/theme';
import { Button } from '../ui';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'receipt-outline',
  title,
  subtitle,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: theme.primaryMuted }]}>
        <Ionicons name={icon} size={28} color={theme.primary} />
      </View>

      <Text style={[Typography.subhead, styles.title, { color: theme.textPrimary }]}>
        {title}
      </Text>

      {subtitle && (
        <Text style={[Typography.caption, styles.subtitle, { color: theme.textSecondary }]}>
          {subtitle}
        </Text>
      )}

      {actionTitle && onAction && (
        <View style={styles.actionWrapper}>
          <Button
            title={actionTitle}
            onPress={onAction}
            variant="secondary"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
  actionWrapper: {
    marginTop: Spacing.md,
  },
});
