import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Wallet } from '../../types/models';
import { formatCurrency, getWalletIcon } from '../../utils/formatters';

interface WalletListItemProps {
  wallet: Wallet;
  onEdit: () => void;
  onDelete: () => void;
}

export function WalletListItem({ wallet, onEdit, onDelete }: WalletListItemProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const numericBalance = Number(wallet.balance) || 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        Shadows.card,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.typeCol}>
          <View style={[styles.iconBox, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons
              name={getWalletIcon(wallet.type)}
              size={20}
              color={theme.primary}
            />
          </View>
          <View style={styles.details}>
            <Text
              style={[Typography.headline, styles.name, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {wallet.name}
            </Text>
            <Text style={[Typography.caption, { color: theme.textSecondary }]}>
              {Strings.dashboard.accountTypeSuffix(wallet.type)}
            </Text>
          </View>
        </View>

        {/* Action buttons (Edit & Delete) */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onEdit}
            style={[styles.actionBtn, { backgroundColor: theme.surfaceSubtle }]}
            accessibilityLabel={Strings.common.edit}
          >
            <Ionicons name="pencil" size={16} color={theme.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onDelete}
            style={[styles.actionBtn, { backgroundColor: `${theme.expense}15` }]}
            accessibilityLabel={Strings.common.delete}
          >
            <Ionicons name="trash" size={16} color={theme.expense} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Balance Row */}
      <View style={[styles.balanceRow, { borderTopColor: theme.borderSubtle }]}>
        <Text style={[Typography.caption, { color: theme.textTertiary }]}>
          {Strings.home.totalBalanceTitle}
        </Text>
        <Text
          style={[
            Typography.title3,
            styles.balanceText,
            { color: numericBalance >= 0 ? theme.textPrimary : theme.expense },
          ]}
        >
          {formatCurrency(numericBalance)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  typeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingEnd: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  details: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    marginBottom: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  balanceText: {
    fontWeight: '700',
  },
});
