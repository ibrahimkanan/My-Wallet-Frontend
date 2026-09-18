import React, { useEffect, useState, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
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
import api from '../../../services/api';
import {
  Wallet,
  Transaction,
  BudgetSummaryItem,
  Category,
} from '../../../types/models';
import {
  GetWalletsResponse,
  GetTransactionsResponse,
  GetBudgetSummaryResponse,
  GetCategoriesResponse,
} from '../../../types/api';
import { formatCurrency } from '../../../utils/formatters';
import {
  WalletCard,
  BudgetProgressCard,
  TransactionItem,
  EmptyState,
  FloatingActionButton,
} from '../../../components/home';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const user = useAuthStore((state) => state.user);

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [overallBudget, setOverallBudget] = useState<{
    budgeted: number;
    spent: number;
    remaining: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch all dashboard data concurrently
  const fetchDashboardData = useCallback(async () => {
    try {
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const [walletsRes, budgetRes, transactionsRes, categoriesRes] =
        await Promise.allSettled([
          api.get<GetWalletsResponse>('/wallets'),
          api.get<GetBudgetSummaryResponse>(
            `/budgets/summary?month=${currentMonth}&year=${currentYear}`
          ),
          api.get<GetTransactionsResponse>('/transactions?limit=5'),
          api.get<GetCategoriesResponse>('/categories'),
        ]);

      // 1. Wallets
      if (walletsRes.status === 'fulfilled' && walletsRes.value.data?.wallets) {
        setWallets(walletsRes.value.data.wallets);
      }

      // 2. Budget Summary
      if (budgetRes.status === 'fulfilled' && budgetRes.value.data?.summary) {
        const summary = budgetRes.value.data.summary;
        // Overall budget has category_id: null
        const overall = summary.find((item: BudgetSummaryItem) => item.category_id === null);

        if (overall) {
          setOverallBudget({
            budgeted: Number(overall.budgeted) || 0,
            spent: Number(overall.spent) || 0,
            remaining: Number(overall.remaining) || 0,
          });
        } else if (user?.default_monthly_budget) {
          const fallbackBudget = Number(user.default_monthly_budget);
          setOverallBudget({
            budgeted: fallbackBudget,
            spent: 0,
            remaining: fallbackBudget,
          });
        }
      } else if (user?.default_monthly_budget) {
        const fallbackBudget = Number(user.default_monthly_budget);
        setOverallBudget({
          budgeted: fallbackBudget,
          spent: 0,
          remaining: fallbackBudget,
        });
      }

      // 3. Transactions
      if (
        transactionsRes.status === 'fulfilled' &&
        transactionsRes.value.data?.transactions
      ) {
        setTransactions(transactionsRes.value.data.transactions);
      }

      // 4. Categories
      if (
        categoriesRes.status === 'fulfilled' &&
        categoriesRes.value.data?.categories
      ) {
        setCategories(categoriesRes.value.data.categories);
      }
    } catch (err) {
      console.warn('[Home] Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.default_monthly_budget]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Helper lookups
  const categoryMap = new Map<string, Category>(
    categories.map((c) => [c.id, c])
  );
  const walletMap = new Map<string, Wallet>(
    wallets.map((w) => [w.id, w])
  );

  const totalBalance = wallets.reduce(
    (acc, w) => acc + (Number(w.balance) || 0),
    0
  );

  const displayName = user?.name ? user.name.split(' ')[0] : null;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[Typography.caption, { color: theme.textSecondary, marginTop: Spacing.sm }]}>
            {Strings.common.loading}
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
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
            {/* Header / Greeting */}
            <View style={styles.headerRow}>
              <View style={styles.greetingCol}>
                <Text
                  style={[
                    Typography.title2,
                    styles.greetingText,
                    { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                  ]}
                >
                  {Strings.home.greetingWelcome(displayName)} 👋
                </Text>
                <Text
                  style={[
                    Typography.caption,
                    { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                  ]}
                >
                  {Strings.dashboard.headerSubtitle}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/profile' as any)}
                style={[
                  styles.avatarButton,
                  { backgroundColor: theme.primaryMuted, borderColor: theme.border },
                ]}
              >
                <Ionicons name="person" size={18} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* Total Balance Hero Card */}
            <View
              style={[
                styles.balanceHeroCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
                Shadows.card,
              ]}
            >
              <View style={styles.balanceHeroTop}>
                <View style={styles.balanceTitleRow}>
                  <View style={[styles.balanceIconBadge, { backgroundColor: theme.primaryMuted }]}>
                    <Ionicons name="wallet-outline" size={16} color={theme.primary} />
                  </View>
                  <Text style={[Typography.subhead, { color: theme.textSecondary }]}>
                    {Strings.home.totalBalanceTitle}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${theme.income}18` }]}>
                  <View style={[styles.statusDot, { backgroundColor: theme.income }]} />
                  <Text style={[Typography.caption, { color: theme.income, fontWeight: '700' }]}>
                    {Strings.dashboard.statusActive}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  Typography.moneyHero,
                  styles.totalBalanceText,
                  {
                    color: totalBalance >= 0 ? theme.textPrimary : theme.expense,
                    textAlign: I18nManager.isRTL ? 'right' : 'left',
                  },
                ]}
              >
                {formatCurrency(totalBalance)}
              </Text>
            </View>

            {/* Wallets Horizontal Breakdown */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  Typography.headline,
                  styles.sectionTitle,
                  { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              >
                {Strings.home.walletsBreakdownTitle}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/wallets' as any)}
              >
                <Text style={[Typography.caption, { color: theme.primary, fontWeight: '700' }]}>
                  {Strings.wallets.title} ←
                </Text>
              </TouchableOpacity>
            </View>

            {wallets.length === 0 ? (
              <EmptyState
                icon="wallet-outline"
                title={Strings.dashboard.emptyWallets}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.walletsScroll}
              >
                {wallets.map((wallet) => (
                  <WalletCard
                    key={wallet.id}
                    wallet={wallet}
                    onPress={() => router.push('/transactions' as any)}
                  />
                ))}
              </ScrollView>
            )}

            {/* Monthly Budget Progress Card */}
            <View style={{ marginTop: Spacing.md }}>
              <BudgetProgressCard
                budgeted={overallBudget?.budgeted || 0}
                spent={overallBudget?.spent || 0}
                remaining={overallBudget?.remaining || 0}
                onPress={() => router.push('/budgets' as any)}
              />
            </View>

            {/* Recent Transactions Section */}
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  Typography.headline,
                  styles.sectionTitle,
                  { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              >
                {Strings.home.recentTransactionsTitle}
              </Text>
              {transactions.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push('/transactions' as any)}
                >
                  <Text style={[Typography.caption, { color: theme.primary, fontWeight: '700' }]}>
                    {Strings.home.viewAllAction} ←
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {transactions.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title={Strings.home.noTransactionsTitle}
                subtitle={Strings.home.noTransactionsSubtitle}
                actionTitle={Strings.home.addTransactionButton}
                onAction={() => router.push('/transaction/new' as any)}
              />
            ) : (
              <View style={styles.transactionsList}>
                {transactions.map((tx) => {
                  const cat = tx.category_id ? categoryMap.get(tx.category_id) : undefined;
                  const wallet = walletMap.get(tx.wallet_id);

                  return (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      categoryName={cat?.name}
                      walletName={wallet?.name}
                      onPress={() =>
                        router.push({
                          pathname: '/transaction/new',
                          params: { id: tx.id, initialData: JSON.stringify(tx) },
                        } as any)
                      }
                    />
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Floating Action Button (FAB) */}
          <FloatingActionButton
            onPress={() => router.push('/transaction/new' as any)}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 90, // Leave room for FAB and TabBar
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },
  greetingCol: {
    flex: 1,
  },
  greetingText: {
    fontWeight: '700',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceHeroCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  balanceHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  balanceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  balanceIconBadge: {
    width: 28,
    height: 28,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  totalBalanceText: {
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  walletsScroll: {
    paddingVertical: Spacing.xs,
    paddingRight: Spacing.xs,
  },
  transactionsList: {
    marginTop: Spacing.xs,
  },
});
