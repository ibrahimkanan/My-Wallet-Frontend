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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeColors, Typography, Spacing, Radii, Shadows, BrandColors } from '../../constants/theme';
import { Button } from '../../components/ui';
import api from '../../services/api';
import { getRefreshToken } from '../../services/tokens';
import { useAuthStore } from '../../store/authStore';
import { Wallet } from '../../types/models';
import { GetWalletsResponse } from '../../types/api';

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
            <Text style={[Typography.caption, { color: theme.textTertiary, textTransform: 'uppercase' }]}>
              Financial Dashboard
            </Text>
            <Text style={[Typography.title1, { color: theme.textPrimary }]}>
              {user?.name ? `Hello, ${user.name}` : 'Welcome Back'}
            </Text>
            <Text style={[Typography.footnote, { color: theme.textSecondary }]}>
              {user?.email}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.avatarCircle, { backgroundColor: theme.primaryMuted, borderColor: theme.border }]}
          >
            <Text style={styles.avatarEmoji}>🌿</Text>
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
            <Text style={[Typography.caption, { color: theme.textTertiary, letterSpacing: 0.8 }]}>
              TOTAL ASSETS BALANCE
            </Text>
            <View style={[styles.statusPill, { backgroundColor: theme.incomeBg }]}>
              <Text style={[Typography.caption, { color: theme.income, fontWeight: '700' }]}>
                ACTIVE
              </Text>
            </View>
          </View>

          <Text style={[Typography.moneyHero, { color: theme.textPrimary, marginVertical: Spacing.xs }]}>
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          <View style={styles.budgetStatsRow}>
            <View style={styles.statCol}>
              <Text style={[Typography.caption, { color: theme.textTertiary }]}>Monthly Budget</Text>
              <Text style={[Typography.moneyRegular, { color: BrandColors.gold500 }]}>
                ${defaultBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={styles.statCol}>
              <Text style={[Typography.caption, { color: theme.textTertiary }]}>Primary Wallets</Text>
              <Text style={[Typography.moneyRegular, { color: theme.textPrimary }]}>
                {wallets.length} {wallets.length === 1 ? 'Account' : 'Accounts'}
              </Text>
            </View>
          </View>
        </View>

        {/* Wallets List Section */}
        <View style={styles.sectionHeader}>
          <Text style={[Typography.title3, { color: theme.textPrimary }]}>
            Your Accounts & Wallets
          </Text>
        </View>

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={theme.primary} />
          </View>
        ) : wallets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[Typography.bodyMedium, { color: theme.textSecondary }]}>
              No wallets found. Create one to get started!
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
                  <Text style={[Typography.headline, { color: theme.textPrimary }]}>
                    {wallet.name}
                  </Text>
                  <Text style={[Typography.caption, { color: theme.textSecondary, textTransform: 'capitalize' }]}>
                    {wallet.type} Account
                  </Text>
                </View>
              </View>

              <Text style={[Typography.moneyRegular, { color: theme.income }]}>
                ${Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))
        )}

        {/* Sign Out Action */}
        <View style={styles.footerSection}>
          <Button
            title="Sign Out"
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
