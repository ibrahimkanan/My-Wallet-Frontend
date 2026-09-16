import React from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, BrandColors } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Transaction } from '../../types/models';
import { formatCurrency } from '../../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  categoryName?: string | null;
  walletName?: string | null;
  onPress?: () => void;
}

export function TransactionItem({
  transaction,
  categoryName,
  walletName,
  onPress,
}: TransactionItemProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const isIncome = transaction.type === 'income';
  const amountColor = isIncome ? theme.income : theme.expense;
  const sign = isIncome ? '+' : '-';

  // Format date relative or localized
  const formatTxDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const txDate = new Date(dateStr);
      const now = new Date();
      const isToday =
        txDate.getFullYear() === now.getFullYear() &&
        txDate.getMonth() === now.getMonth() &&
        txDate.getDate() === now.getDate();

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday =
        txDate.getFullYear() === yesterday.getFullYear() &&
        txDate.getMonth() === yesterday.getMonth() &&
        txDate.getDate() === yesterday.getDate();

      if (isToday) return Strings.home.todayLabel;
      if (isYesterday) return Strings.home.yesterdayLabel;

      return `${txDate.getFullYear()}/${txDate.getMonth() + 1}/${txDate.getDate()}`;
    } catch {
      return dateStr;
    }
  };

  const displayName =
    categoryName || transaction.note || Strings.home.generalCategory;
  const displayWallet = walletName || Strings.home.walletDefault;
  const dateFormatted = formatTxDate(transaction.transaction_date);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor: isIncome
              ? `${theme.income}18`
              : `${theme.expense}18`,
          },
        ]}
      >
        <Ionicons
          name={isIncome ? 'arrow-down' : 'arrow-up'}
          size={18}
          color={amountColor}
        />
      </View>

      {/* Details */}
      <View style={styles.detailsCol}>
        <Text
          style={[Typography.bodyMedium, styles.titleText, { color: theme.textPrimary }]}
          numberOfLines={1}
        >
          {displayName}
        </Text>
        <View style={styles.subMetaRow}>
          <Text
            style={[Typography.caption, { color: theme.textTertiary }]}
            numberOfLines={1}
          >
            {displayWallet}
          </Text>
          <Text style={[Typography.caption, { color: theme.textTertiary }]}> • </Text>
          <Text style={[Typography.caption, { color: theme.textTertiary }]}>
            {dateFormatted}
          </Text>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.amountCol}>
        <Text
          style={[Typography.subhead, styles.amountText, { color: amountColor }]}
          numberOfLines={1}
        >
          {sign} {formatCurrency(Number(transaction.amount))}
        </Text>
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
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: Spacing.sm,
  },
  amountText: {
    fontWeight: '700',
  },
});
