import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Category, BudgetSummaryItem } from '../../types/models';
import { formatCurrency } from '../../utils/formatters';
import { ProgressBar } from '../ui/ProgressBar';

interface CategoryBudgetCardProps {
  item: BudgetSummaryItem;
  category?: Category;
  onPress: () => void;
}

export function CategoryBudgetCard({
  item,
  category,
  onPress,
}: CategoryBudgetCardProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const catName = category?.name || Strings.transactions.uncategorized;
  const budgeted = item.budgeted;
  const spent = item.spent;
  const ratio = budgeted > 0 ? spent / budgeted : 0;
  const percentage = Math.round(ratio * 100);
  const isOver = spent > budgeted;

  let statusColor = theme.income;
  if (isOver) {
    statusColor = theme.expense;
  } else if (percentage >= 80) {
    statusColor = theme.warning;
  }

  const clampedProgress = Math.min(Math.max(ratio, 0), 1);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: isOver ? theme.expense : theme.border,
        },
        Shadows.subtle,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <View style={[styles.iconWrapper, { backgroundColor: `${statusColor}15` }]}>
            <Ionicons
              name={(category?.icon as any) || 'pricetag-outline'}
              size={18}
              color={statusColor}
            />
          </View>
          <View>
            <Text style={[Typography.bodyMedium, styles.catName, { color: theme.textPrimary }]}>
              {catName}
            </Text>
            <Text style={[Typography.caption, { color: theme.textSecondary }]}>
              {Strings.budgets.spentOf(formatCurrency(spent), formatCurrency(budgeted))}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.percentBadge,
            {
              backgroundColor: isOver ? `${theme.expense}15` : theme.surfaceSubtle,
            },
          ]}
        >
          <Text
            style={[
              Typography.caption,
              {
                color: isOver ? theme.expense : theme.textSecondary,
                fontWeight: '700',
              },
            ]}
          >
            {percentage}%
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <ProgressBar
        progress={clampedProgress}
        color={statusColor}
        height={6}
        style={{ marginTop: Spacing.sm }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  percentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
});
