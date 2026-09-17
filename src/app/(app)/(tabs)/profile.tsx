import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  I18nManager,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ThemeColors,
  Typography,
  Spacing,
  Radii,
  Shadows,
  BrandColors,
} from '../../../constants/theme';
import { Strings } from '../../../constants/strings';
import { useAuthStore } from '../../../store/authStore';
import { Button } from '../../../components/ui';
import api from '../../../services/api';
import { getRefreshToken } from '../../../services/tokens';
import { formatCurrency } from '../../../utils/formatters';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('[Profile] Error during logout:', error);
    } finally {
      await clearAuth();
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text
            style={[
              Typography.title1,
              styles.headerTitle,
              { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          >
            {Strings.tabs.profile}
          </Text>
        </View>

        {/* User Card */}
        <View
          style={[
            styles.userCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.card,
          ]}
        >
          <View style={[styles.avatarBadge, { backgroundColor: theme.primaryMuted }]}>
            <Ionicons name="person" size={36} color={theme.primary} />
          </View>
          <Text style={[Typography.title2, styles.userName, { color: theme.textPrimary }]}>
            {user?.name || 'مستخدم محفظتي'}
          </Text>
          <Text style={[Typography.caption, { color: theme.textSecondary }]}>
            {user?.email}
          </Text>

          {user?.default_monthly_budget ? (
            <View style={[styles.budgetRow, { backgroundColor: theme.surfaceSubtle }]}>
              <Ionicons name="calendar-outline" size={16} color={theme.primary} />
              <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                {Strings.dashboard.monthlyBudget}:
              </Text>
              <Text style={[Typography.subhead, { color: theme.primary, fontWeight: '700' }]}>
                {formatCurrency(Number(user.default_monthly_budget))}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Management & Customization Section */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              Typography.headline,
              styles.sectionTitle,
              { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          >
            {Strings.settings.manageSection}
          </Text>
        </View>

        {/* Manage Wallets Button Row */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/wallets' as any)}
          style={[
            styles.navCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.card,
          ]}
        >
          <View style={styles.navCardLeft}>
            <View style={[styles.navIconBox, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="wallet-outline" size={22} color={theme.primary} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={[Typography.subhead, styles.navTitle, { color: theme.textPrimary }]}>
                {Strings.settings.manageWallets}
              </Text>
              <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                {Strings.settings.manageWalletsDesc}
              </Text>
            </View>
          </View>
          <Ionicons
            name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
            size={20}
            color={theme.textTertiary}
          />
        </TouchableOpacity>

        {/* Manage Categories Button Row */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/categories' as any)}
          style={[
            styles.navCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.card,
          ]}
        >
          <View style={styles.navCardLeft}>
            <View style={[styles.navIconBox, { backgroundColor: `${BrandColors.jade500}15` }]}>
              <Ionicons name="pricetags-outline" size={22} color={BrandColors.jade500} />
            </View>
            <View style={styles.navTextCol}>
              <Text style={[Typography.subhead, styles.navTitle, { color: theme.textPrimary }]}>
                {Strings.settings.manageCategories}
              </Text>
              <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                {Strings.settings.manageCategoriesDesc}
              </Text>
            </View>
          </View>
          <Ionicons
            name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
            size={20}
            color={theme.textTertiary}
          />
        </TouchableOpacity>

        {/* Sign Out Action */}
        <View style={styles.logoutWrapper}>
          <Button
            title={Strings.dashboard.signOutButton}
            onPress={handleSignOut}
            variant="danger"
            loading={signingOut}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontWeight: '800',
  },
  userCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatarBadge: {
    width: 76,
    height: 76,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    marginTop: Spacing.md,
  },
  sectionHeader: {
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  navCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    paddingEnd: Spacing.sm,
  },
  navIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTextCol: {
    flex: 1,
  },
  navTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  logoutWrapper: {
    marginTop: Spacing.lg,
  },
});
