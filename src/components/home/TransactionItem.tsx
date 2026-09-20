import React from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Transaction } from '../../types/models';
import { formatCurrency, formatRelativeDate } from '../../utils/formatters';
import { useLanguage } from '../../i18n';

export interface TransactionItemProps {
  transaction: Transaction;
  categoryName?: string | null;
  categoryIcon?: string | null;
  walletName?: string | null;
  showDate?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
}

export function TransactionItem({
  transaction,
  categoryName,
  categoryIcon,
  walletName,
  showDate = true,
  onPress,
  onDelete,
}: TransactionItemProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { language, isRTL, strings } = useLanguage();

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? theme.income : theme.expense;
  const sign = isIncome ? '+' : '-';

  const displayName = categoryName || transaction.note || strings.home.generalCategory;
  const displayWallet = walletName || strings.home.walletDefault;
  const dateFormatted = formatRelativeDate(transaction.transaction_date, language);

  const resolvedIcon = categoryIcon
    ? (categoryIcon as any)
    : isIncome
    ? 'arrow-down'
    : 'arrow-up';

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
        Shadows.subtle,
      ]}
    >
      {/* Category Icon Badge */}
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: isIncome ? `${theme.income}18` : `${theme.expense}18`,
            marginHorizontal: Spacing.xs,
          },
        ]}
      >
        <Ionicons name={resolvedIcon} size={18} color={amountColor} />
      </View>

      {/* Info Column */}
      <View style={[styles.detailsCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text
          style={[Typography.bodyMedium, styles.titleText, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}
          numberOfLines={1}
        >
          {displayName}
        </Text>

        {transaction.note && categoryName ? (
          <Text
            style={[Typography.caption, styles.noteText, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}
            numberOfLines={1}
          >
            {transaction.note}
          </Text>
        ) : null}

        <View style={[styles.subMetaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Ionicons
            name="wallet-outline"
            size={12}
            color={theme.textTertiary}
            style={{ marginHorizontal: 3 }}
          />
          <Text style={[Typography.caption, { color: theme.textTertiary, fontSize: 11 }]}>
            {displayWallet}
          </Text>
          {showDate && dateFormatted ? (
            <>
              <Text style={[Typography.caption, { color: theme.textTertiary }]}> • </Text>
              <Text style={[Typography.caption, { color: theme.textTertiary, fontSize: 11 }]}>
                {dateFormatted}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      {/* Amount & Actions */}
      <View style={[styles.amountCol, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
        <Text
          style={[Typography.subhead, styles.amountText, { color: amountColor, textAlign: isRTL ? 'right' : 'left' }]}
          numberOfLines={1}
        >
          {sign} {formatCurrency(Number(transaction.amount))}
        </Text>

        {onDelete ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.deleteBtn, { backgroundColor: theme.surfaceSubtle }]}
          >
            <Ionicons name="trash-outline" size={14} color={theme.expense} />
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontWeight: '600',
    marginBottom: 2,
  },
  noteText: {
    marginBottom: 2,
    fontSize: 12,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: Spacing.sm,
    gap: 4,
  },
  amountText: {
    fontWeight: '700',
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
});
