import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  ScrollView,
  TouchableOpacity,
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
import { useAuthStore } from '../../../store/authStore';
import { useLanguage } from '../../../i18n';
import { Button, SettingRow } from '../../../components';
import api from '../../../services/api';
import { getRefreshToken } from '../../../services/tokens';
import { formatCurrency } from '../../../utils/formatters';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const { language, isRTL, setLanguage, strings } = useLanguage();
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
              { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {strings.tabs.profile}
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
            {user?.name || strings.settings.userDefault}
          </Text>
          <Text style={[Typography.caption, { color: theme.textSecondary }]}>
            {user?.email}
          </Text>

          {user?.default_monthly_budget ? (
            <View style={[styles.budgetRow, { backgroundColor: theme.surfaceSubtle }]}>
              <Ionicons name="calendar-outline" size={16} color={theme.primary} />
              <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                {strings.dashboard.monthlyBudget}:
              </Text>
              <Text style={[Typography.subhead, { color: theme.primary, fontWeight: '700' }]}>
                {formatCurrency(Number(user.default_monthly_budget))}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Language & Preferences Section */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              Typography.headline,
              styles.sectionTitle,
              { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {strings.settings.preferencesSection}
          </Text>
        </View>

        <View
          style={[
            styles.languageCard,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.card,
          ]}
        >
          <View
            style={[
              styles.languageHeader,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={[styles.langIconBox, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="globe-outline" size={20} color={theme.primary} />
            </View>
            <View style={[styles.langTextCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[Typography.subhead, styles.langTitle, { color: theme.textPrimary }]}>
                {strings.settings.languageLabel}
              </Text>
              <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                {strings.settings.languageDesc}
              </Text>
            </View>
          </View>

          {/* Segmented Control */}
          <View style={[styles.segmentedTrack, { backgroundColor: theme.surfaceSubtle }]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLanguage('en')}
              style={[
                styles.segmentTab,
                language === 'en' && [
                  styles.segmentTabActive,
                  { backgroundColor: theme.primary },
                  Shadows.subtle,
                ],
              ]}
            >
              <Text
                style={[
                  Typography.subhead,
                  styles.segmentText,
                  {
                    color: language === 'en' ? theme.textInverse : theme.textSecondary,
                    fontWeight: language === 'en' ? '700' : '500',
                  },
                ]}
              >
                {strings.settings.langEnglish}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLanguage('ar')}
              style={[
                styles.segmentTab,
                language === 'ar' && [
                  styles.segmentTabActive,
                  { backgroundColor: theme.primary },
                  Shadows.subtle,
                ],
              ]}
            >
              <Text
                style={[
                  Typography.subhead,
                  styles.segmentText,
                  {
                    color: language === 'ar' ? theme.textInverse : theme.textSecondary,
                    fontWeight: language === 'ar' ? '700' : '500',
                  },
                ]}
              >
                {strings.settings.langArabic}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Management & Customization Section */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              Typography.headline,
              styles.sectionTitle,
              { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {strings.settings.manageSection}
          </Text>
        </View>

        {/* Manage Wallets Row */}
        <SettingRow
          title={strings.settings.manageWallets}
          subtitle={strings.settings.manageWalletsDesc}
          icon="wallet-outline"
          iconColor={theme.primary}
          iconBg={theme.primaryMuted}
          onPress={() => router.push('/wallets' as any)}
        />

        {/* Manage Categories Row */}
        <SettingRow
          title={strings.settings.manageCategories}
          subtitle={strings.settings.manageCategoriesDesc}
          icon="pricetags-outline"
          iconColor={BrandColors.jade500}
          iconBg={`${BrandColors.jade500}15`}
          onPress={() => router.push('/categories' as any)}
        />

        {/* Sign Out Action */}
        <View style={styles.logoutWrapper}>
          <Button
            title={strings.dashboard.signOutButton}
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
  languageCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  languageHeader: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  langIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langTextCol: {
    flex: 1,
  },
  langTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  segmentedTrack: {
    flexDirection: 'row',
    borderRadius: Radii.lg,
    padding: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  segmentTabActive: {
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
  },
  logoutWrapper: {
    marginTop: Spacing.lg,
  },
});
