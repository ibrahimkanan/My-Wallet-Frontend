import React from 'react';
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, I18nManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../../constants/theme';
import { Strings } from '../../../constants/strings';
import { Button } from '../../../components/ui';

export default function NewTransactionModal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Bar with Dismiss */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <Text style={[Typography.subhead, styles.topBarTitle, { color: theme.textPrimary }]}>
          {Strings.placeholders.newTransactionTitle}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          style={[styles.closeButton, { backgroundColor: theme.surfaceSubtle }]}
        >
          <Ionicons name="close" size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.card,
          ]}
        >
          <View style={[styles.iconWrapper, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="add-circle-outline" size={36} color={theme.primary} />
          </View>
          <Text style={[Typography.title3, styles.title, { color: theme.textPrimary }]}>
            {Strings.placeholders.newTransactionTitle}
          </Text>
          <Text style={[Typography.bodyMedium, styles.subtitle, { color: theme.textSecondary }]}>
            {Strings.placeholders.newTransactionSubtitle}
          </Text>
          <View style={[styles.badge, { backgroundColor: theme.surfaceSubtle }]}>
            <Text style={[Typography.caption, { color: theme.primary, fontWeight: '700' }]}>
              {Strings.placeholders.comingSoon}
            </Text>
          </View>
        </View>

        <View style={styles.footerAction}>
          <Button
            title={Strings.placeholders.closeModal}
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  iconWrapper: {
    width: 68,
    height: 68,
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
  footerAction: {
    marginTop: Spacing.xl,
  },
});
