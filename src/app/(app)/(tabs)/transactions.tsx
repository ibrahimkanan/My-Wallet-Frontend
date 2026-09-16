import React from 'react';
import { View, Text, StyleSheet, useColorScheme, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../../constants/theme';
import { Strings } from '../../../constants/strings';

export default function TransactionsScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text
          style={[
            Typography.title1,
            styles.headerTitle,
            { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        >
          {Strings.tabs.transactions}
        </Text>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.card,
          ]}
        >
          <View style={[styles.iconWrapper, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="receipt-outline" size={32} color={theme.primary} />
          </View>
          <Text style={[Typography.title3, styles.title, { color: theme.textPrimary }]}>
            {Strings.placeholders.transactionsTitle}
          </Text>
          <Text style={[Typography.bodyMedium, styles.subtitle, { color: theme.textSecondary }]}>
            {Strings.placeholders.transactionsSubtitle}
          </Text>
          <View style={[styles.badge, { backgroundColor: theme.surfaceSubtle }]}>
            <Text style={[Typography.caption, { color: theme.primary, fontWeight: '700' }]}>
              {Strings.placeholders.comingSoon}
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontWeight: '800',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
  },
});
