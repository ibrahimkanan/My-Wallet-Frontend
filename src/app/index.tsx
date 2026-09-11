import React from 'react';
import { View, Text, StyleSheet, useColorScheme, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ThemeColors,
  Typography,
  Spacing,
  Radii,
  Shadows,
  BrandColors,
} from '../constants/theme';
import { useAuthStore } from '../store/authStore';

export default function IndexScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? ThemeColors.dark : ThemeColors.light;
  const { isAuthenticated, isLoading } = useAuthStore();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Badge */}
        <View style={[styles.badge, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}>
          <View style={[styles.badgeDot, { backgroundColor: theme.primary }]} />
          <Text style={[styles.badgeText, { color: theme.primary }]}>
            PHASE 1: FOUNDATION READY
          </Text>
        </View>

        {/* Title & Subtitle */}
        <View style={styles.headerBlock}>
          <Text style={[Typography.display, { color: theme.textPrimary }]}>
            My Wallet
          </Text>
          <Text style={[Typography.bodyMedium, { color: theme.textSecondary, marginTop: Spacing.xs }]}>
            Personal Wealth & Finance Engine
          </Text>
        </View>

        {/* Status Card */}
        <View
          style={[
            styles.card,
            Shadows.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[Typography.caption, { color: theme.textTertiary, textTransform: 'uppercase' }]}>
              Environment & Core Services
            </Text>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor: isLoading
                    ? theme.warningBg
                    : isAuthenticated
                    ? theme.incomeBg
                    : theme.surfaceSubtle,
                },
              ]}
            >
              <Text
                style={[
                  Typography.caption,
                  {
                    color: isLoading
                      ? theme.warning
                      : isAuthenticated
                      ? theme.income
                      : theme.textSecondary,
                    fontWeight: '600',
                  },
                ]}
              >
                {isLoading ? 'Hydrating...' : isAuthenticated ? 'Authenticated' : 'Session Ready'}
              </Text>
            </View>
          </View>

          <View style={styles.itemsList}>
            <ServiceRow
              label="SecureStore Token Storage"
              detail="Encrypted accessToken + rotating refreshToken"
              theme={theme}
            />
            <ServiceRow
              label="Axios 401 Interceptor"
              detail="Concurrent request queue & token rotation"
              theme={theme}
            />
            <ServiceRow
              label="Zustand Auth Store"
              detail="Global auth state & user profile"
              theme={theme}
            />
            <ServiceRow
              label="Visual Identity"
              detail="Nordic Pine & Champagne Gold design system"
              theme={theme}
            />
          </View>
        </View>

        {/* Color Palette Preview */}
        <View style={styles.paletteSection}>
          <Text style={[Typography.caption, { color: theme.textTertiary, marginBottom: Spacing.sm }]}>
            DESIGN SYSTEM PALETTE
          </Text>
          <View style={styles.colorPillsContainer}>
            <ColorSwatch label="Pine" color={BrandColors.pine600} />
            <ColorSwatch label="Mint" color={BrandColors.pine400} />
            <ColorSwatch label="Gold" color={BrandColors.gold500} />
            <ColorSwatch label="Jade" color={BrandColors.jade500} />
            <ColorSwatch label="Rose" color={BrandColors.rose500} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceRow({
  label,
  detail,
  theme,
}: {
  label: string;
  detail: string;
  theme: typeof ThemeColors.light | typeof ThemeColors.dark;
}) {
  return (
    <View style={[styles.serviceRow, { borderBottomColor: theme.borderSubtle }]}>
      <View style={[styles.checkIndicator, { backgroundColor: theme.primaryMuted }]}>
        <Text style={[styles.checkText, { color: theme.primary }]}>✓</Text>
      </View>
      <View style={styles.serviceTextCol}>
        <Text style={[Typography.bodyMedium, { color: theme.textPrimary }]}>{label}</Text>
        <Text style={[Typography.footnote, { color: theme.textSecondary }]}>{detail}</Text>
      </View>
    </View>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.swatchItem}>
      <View style={[styles.swatchCircle, { backgroundColor: color }]} />
      <Text style={[Typography.caption, { color: '#888', marginTop: 4 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.xl,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  headerBlock: {
    gap: 2,
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  itemsList: {
    gap: Spacing.xs,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  checkIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  serviceTextCol: {
    flex: 1,
    gap: 2,
  },
  paletteSection: {
    marginTop: Spacing.sm,
  },
  colorPillsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  swatchItem: {
    alignItems: 'center',
  },
  swatchCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
});
