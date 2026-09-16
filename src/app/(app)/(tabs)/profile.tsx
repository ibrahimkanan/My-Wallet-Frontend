import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  I18nManager,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

        {/* Settings & Info placeholder */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[Typography.subhead, styles.sectionTitle, { color: theme.textPrimary }]}>
            {Strings.placeholders.profileTitle}
          </Text>
          <Text style={[Typography.caption, styles.sectionSubtitle, { color: theme.textSecondary }]}>
            {Strings.placeholders.profileSubtitle}
          </Text>
        </View>

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
  infoCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    lineHeight: 20,
  },
  logoutWrapper: {
    marginTop: Spacing.md,
  },
});
