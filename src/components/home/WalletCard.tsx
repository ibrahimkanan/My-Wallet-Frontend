import React from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Wallet } from '../../types/models';
import { formatCurrency, getWalletIcon } from '../../utils/formatters';
import { useLanguage } from '../../i18n';

interface WalletCardProps {
  wallet: Wallet;
  onPress?: () => void;
}

export function WalletCard({ wallet, onPress }: WalletCardProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { isRTL, strings } = useLanguage();

  const getWalletTypeLabel = (type: Wallet['type']): string => {
    return Strings.dashboard.accountTypeSuffix(type);
  };

  const numericBalance = Number(wallet.balance) || 0;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        Shadows.card,
      ]}
    >
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.primaryMuted }]}>
          <Ionicons name={getWalletIcon(wallet.type)} size={18} color={theme.primary} />
        </View>
        <View style={[styles.badge, { backgroundColor: theme.surfaceSubtle }]}>
          <Text style={[Typography.caption, styles.badgeText, { color: theme.textSecondary }]}>
            {getWalletTypeLabel(wallet.type)}
          </Text>
        </View>
      </View>

      <Text
        style={[Typography.bodyMedium, styles.walletName, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}
        numberOfLines={1}
      >
        {wallet.name || strings.home.walletDefault}
      </Text>

      <View style={styles.balanceContainer}>
        <Text
          style={[
            Typography.title3,
            styles.balanceText,
            {
              color: numericBalance >= 0 ? theme.textPrimary : theme.expense,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
          numberOfLines={1}
        >
          {formatCurrency(numericBalance)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 175,
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginHorizontal: Spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  badgeText: {
    fontSize: 11,
  },
  walletName: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  balanceContainer: {
    marginTop: Spacing.xs,
  },
  balanceText: {
    fontWeight: '700',
  },
});
