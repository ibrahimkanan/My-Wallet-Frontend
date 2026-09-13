import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, Radii, Shadows, BrandColors } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Button } from '../../components/ui';
import api from '../../services/api';
import { getRefreshToken } from '../../services/tokens';
import { useAuthStore } from '../../store/authStore';
import { Wallet } from '../../types/models';
import { GetWalletsResponse } from '../../types/api';
import { formatCurrency } from '../../utils/formatters';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const fetchDashboardData = async () => {
    try {
      // Backend: GET /wallets
      const res = await api.get<GetWalletsResponse>('/wallets');
      if (res.data?.wallets) {
        setWallets(res.data.wallets);
      }
    } catch (error) {
      console.warn('[Home] Failed to load wallets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const refreshToken = await getRefreshToken();
      if (refreshToken) {
        // Backend: POST /auth/logout body: { refreshToken }
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('[Logout] Error sending logout request:', error);
    } finally {
      await clearAuth();
      setSigningOut(false);
    }
  };

  const totalBalance = wallets.reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
  const defaultBudget = user?.default_monthly_budget || 0;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Top Greeting Bar */}
        <View style={styles.topBar}>
          <View style={styles.userInfoCol}>
            <Text
              style={[
                Typography.caption,
                { color: theme.textTertiary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            >
              {Strings.dashboard.headerSubtitle}
            </Text>
            <Text
              style={[
                Typography.title1,
                { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            >
              {Strings.dashboard.greeting(user?.name)}
            </Text>
            <Text
              style={[
                Typography.footnote,
                { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            >
              {user?.email}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.avatarCircle, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}
          >
            <Text style={styles.avatarEmoji}>💸</Text>
          </TouchableOpacity>
        </View>

        {/* Total Net Worth / Balance Card */}
        <View
          style={[
            styles.balanceCard,
            Shadows.elevated,
            {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={[Typography.caption, { color: theme.textTertiary, letterSpacing: 0.5 }]}>
              {Strings.dashboard.totalAssets}
            </Text>
            <View style={[styles.statusPill, { backgroundColor: theme.incomeBg }]}>
              <Text style={[Typography.caption, { color: theme.income, fontWeight: '700' }]}>
                {Strings.dashboard.statusActive}
              </Text>
            </View>
          </View>

          <Text
            style={[
              Typography.moneyHero,
              { color: theme.textPrimary, marginVertical: Spacing.xs, textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          >
            {formatCurrency(totalBalance)}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          <View style={styles.budgetStatsRow}>
            <View style={styles.statCol}>
              <Text
                style={[
                  Typography.caption,
                  { color: theme.textTertiary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              >
                {Strings.dashboard.monthlyBudget}
              </Text>
              <Text style={[Typography.moneyRegular, { color: BrandColors.gold500 }]}>
                {formatCurrency(defaultBudget)}
              </Text>
            </View>

            <View style={styles.statCol}>
              <Text
                style={[
                  Typography.caption,
                  { color: theme.textTertiary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              >
                {Strings.dashboard.walletsCount}
              </Text>
              <Text style={[Typography.moneyRegular, { color: theme.textPrimary }]}>
                {Strings.dashboard.accountsUnit(wallets.length)}
              </Text>
            </View>
          </View>
        </View>

        {/* Wallets List Section */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              Typography.title3,
              { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          >
            {Strings.dashboard.walletsSectionTitle}
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : wallets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[Typography.bodyMedium, { color: theme.textSecondary }]}>
              {Strings.dashboard.emptyWallets}
            </Text>
          </View>
        ) : (
          wallets.map((wallet) => (
            <View
              key={wallet.id}
              style={[
                styles.walletItem,
                Shadows.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.walletLeft}>
                <View style={[styles.walletIconCircle, { backgroundColor: theme.surfaceSubtle }]}>
                  <Text style={styles.walletIconEmoji}>
                    {wallet.type === 'cash' ? '💵' : wallet.type === 'bank' ? '🏛️' : '💳'}
                  </Text>
                </View>
                <View>
                  <Text
                    style={[
                      Typography.headline,
                      { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {wallet.name}
                  </Text>
                  <Text
                    style={[
                      Typography.caption,
                      { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                    ]}
                  >
                    {Strings.dashboard.accountTypeSuffix(wallet.type)}
                  </Text>
                </View>
              </View>

              <Text style={[Typography.moneyRegular, { color: theme.income }]}>
                {formatCurrency(Number(wallet.balance))}
              </Text>
            </View>
          ))
        )}

        {/* Sign Out Action */}
        <View style={styles.footerSection}>
          <Button
            title={Strings.dashboard.signOutButton}
            variant="secondary"
            loading={signingOut}
            onPress={handleSignOut}
            style={styles.signOutButton}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  userInfoCol: {
    flex: 1,
    gap: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  balanceCard: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  budgetStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    gap: 2,
  },
  sectionHeader: {
    marginTop: Spacing.sm,
  },
  loaderContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletIconEmoji: {
    fontSize: 20,
  },
  footerSection: {
    marginTop: Spacing.xl,
  },
  signOutButton: {
    height: 48,
  },
});
