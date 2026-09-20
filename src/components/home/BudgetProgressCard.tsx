import React from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { formatCurrency } from '../../utils/formatters';
import { ProgressBar } from '../ui/ProgressBar';
import { useLanguage } from '../../i18n';

interface BudgetProgressCardProps {
  budgeted: number;
  spent: number;
  remaining: number;
  onPress?: () => void;
}

export function BudgetProgressCard({
  budgeted,
  spent,
  remaining,
  onPress,
}: BudgetProgressCardProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { isRTL, strings } = useLanguage();

  const hasBudget = budgeted > 0;
  const isOverBudget = hasBudget && spent > budgeted;
  const usageRatio = hasBudget ? spent / budgeted : 0;
  const usagePercentage = Math.round(usageRatio * 100);
  const clampedProgress = Math.min(Math.max(usageRatio, 0), 1);

  // Determine indicator color
  let progressColor: string = theme.income;
  if (isOverBudget) {
    progressColor = theme.expense;
  } else if (usagePercentage >= 80) {
    progressColor = theme.warning;
  }

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: isOverBudget ? theme.expense : theme.border,
        },
        Shadows.card,
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isOverBudget
                  ? `${theme.expense}15`
                  : theme.primaryMuted,
              },
            ]}
          >
            <Ionicons
              name="pie-chart-outline"
              size={18}
              color={isOverBudget ? theme.expense : theme.primary}
            />
          </View>
          <Text style={[Typography.subhead, styles.title, { color: theme.textPrimary }]}>
            {Strings.home.monthlyBudgetTitle}
          </Text>
        </View>

        {hasBudget && (
          <View
            style={[
              styles.percentBadge,
              {
                backgroundColor: isOverBudget
                  ? `${theme.expense}15`
                  : theme.surfaceSubtle,
              },
            ]}
          >
            <Text
              style={[
                Typography.caption,
                styles.percentText,
                {
                  color: isOverBudget ? theme.expense : theme.textSecondary,
                },
              ]}
            >
              {usagePercentage}%
            </Text>
          </View>
        )}
      </View>

      {!hasBudget ? (
        <View style={styles.emptyContainer}>
          <Text style={[Typography.bodyMedium, { color: theme.textSecondary, marginBottom: Spacing.xs }]}>
            {Strings.home.noBudgetSet}
          </Text>
          <Text style={[Typography.caption, { color: theme.primary, fontWeight: '600' }]}>
            {strings.home.setBudgetPrompt} {isRTL ? '←' : '→'}
          </Text>
        </View>
      ) : (
        <>
          {/* Over-budget warning banner */}
          {isOverBudget && (
            <View style={[styles.warningBanner, { backgroundColor: `${theme.expense}15` }]}>
              <Ionicons name="alert-circle" size={16} color={theme.expense} />
              <Text style={[Typography.caption, styles.warningText, { color: theme.expense }]}>
                {Strings.home.overBudgetWarning(formatCurrency(spent - budgeted))}
              </Text>
            </View>
          )}

          {/* Progress Bar */}
          <ProgressBar
            progress={clampedProgress}
            color={progressColor}
            height={8}
            style={{ marginBottom: Spacing.md }}
          />

          {/* Stats 3-column breakdown */}
          <View style={styles.statsRow}>
            {/* Budgeted */}
            <View style={styles.statCol}>
              <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                {Strings.home.budgetedLabel}
              </Text>
              <Text
                style={[Typography.subhead, styles.statValue, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                {formatCurrency(budgeted)}
              </Text>
            </View>

            {/* Spent */}
            <View style={styles.statCol}>
              <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                {Strings.home.spentLabel}
              </Text>
              <Text
                style={[
                  Typography.subhead,
                  styles.statValue,
                  { color: isOverBudget ? theme.expense : theme.textPrimary },
                ]}
                numberOfLines={1}
              >
                {formatCurrency(spent)}
              </Text>
            </View>

            {/* Remaining */}
            <View style={styles.statCol}>
              <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                {Strings.home.remainingLabel}
              </Text>
              <Text
                style={[
                  Typography.subhead,
                  styles.statValue,
                  {
                    color: remaining >= 0 ? theme.income : theme.expense,
                  },
                ]}
                numberOfLines={1}
              >
                {formatCurrency(remaining)}
              </Text>
            </View>
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
  },
  percentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  percentText: {
    fontWeight: '700',
  },
  emptyContainer: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
    marginBottom: Spacing.sm,
  },
  warningText: {
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: Radii.full,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  statCol: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statValue: {
    fontWeight: '700',
    marginTop: 2,
  },
});
