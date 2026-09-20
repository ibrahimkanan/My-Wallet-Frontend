import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  SectionList,
  useColorScheme,
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
} from '../../../constants/theme';
import { Strings } from '../../../constants/strings';
import {
  LoadingView,
  ConfirmModal,
  ErrorBanner,
  EmptyState,
  TransactionItem,
  TransactionFilterModal,
  FilterState,
} from '../../../components';
import api from '../../../services/api';
import { getErrorMessage } from '../../../utils/errors';
import { Transaction, Wallet, Category } from '../../../types/models';
import {
  GetTransactionsResponse,
  GetWalletsResponse,
  GetCategoriesResponse,
} from '../../../types/api';
import {
  formatCurrency,
  formatTransactionGroupDate,
  formatDateToISO,
  ARABIC_MONTHS,
} from '../../../utils/formatters';

const PAGE_SIZE = 20;

interface DateGroup {
  title: string;
  dateKey: string;
  totalIncome: number;
  totalExpense: number;
  data: Transaction[];
}

export default function TransactionsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  // Master Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Pagination & Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    walletId: null,
    categoryId: null,
    month: null,
    year: null,
  });

  // Draft filters for modal
  const [draftFilters, setDraftFilters] = useState<FilterState>({
    walletId: null,
    categoryId: null,
    month: null,
    year: null,
  });

  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Delete Confirmation State
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Lookups
  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.walletId) count++;
    if (filters.categoryId) count++;
    if (filters.month !== null && filters.year !== null) count++;
    return count;
  }, [filters]);

  // Load auxiliary data (wallets & categories)
  const loadAuxData = useCallback(async () => {
    try {
      const [wRes, cRes] = await Promise.all([
        api.get<GetWalletsResponse>('/wallets'),
        api.get<GetCategoriesResponse>('/categories'),
      ]);
      if (wRes.data?.wallets) setWallets(wRes.data.wallets);
      if (cRes.data?.categories) setCategories(cRes.data.categories);
    } catch (err) {
      console.warn('[Transactions] Could not load wallets or categories:', err);
    }
  }, []);

  // Fetch paginated transactions with active filters
  const fetchTransactions = useCallback(
    async (offset = 0, isRefresh = false) => {
      try {
        if (!isRefresh && offset === 0) setLoading(true);
        if (offset > 0) setLoadingMore(true);
        setFetchError(null);

        const params: Record<string, string | number> = {
          limit: PAGE_SIZE,
          offset,
        };

        if (filters.walletId) params.wallet_id = filters.walletId;
        if (filters.categoryId) params.category_id = filters.categoryId;

        if (filters.month !== null && filters.year !== null) {
          const mStr = String(filters.month).padStart(2, '0');
          const lastDay = new Date(filters.year, filters.month, 0).getDate();
          params.start_date = `${filters.year}-${mStr}-01`;
          params.end_date = `${filters.year}-${mStr}-${String(lastDay).padStart(2, '0')}`;
        }

        const res = await api.get<GetTransactionsResponse>('/transactions', { params });
        const newItems = res.data?.transactions || [];

        if (offset === 0) {
          setTransactions(newItems);
        } else {
          setTransactions((prev) => [...prev, ...newItems]);
        }

        setHasMore(newItems.length === PAGE_SIZE);
      } catch (err) {
        console.warn('[Transactions] Error fetching transactions:', err);
        setFetchError(getErrorMessage(err, Strings.common.errorOccurred));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  // Focus effect to reload list on tab entry or screen return
  useFocusEffect(
    useCallback(() => {
      loadAuxData();
      fetchTransactions(0);
    }, [loadAuxData, fetchTransactions])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions(0, true);
  };

  // Pagination Trigger
  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchTransactions(transactions.length);
    }
  };

  // Filter actions
  const openFilterModal = () => {
    setDraftFilters({ ...filters });
    setIsFilterModalVisible(true);
  };

  const applyFilters = () => {
    setFilters({ ...draftFilters });
    setIsFilterModalVisible(false);
    setLoading(true);
  };

  const resetFilters = () => {
    const empty: FilterState = { walletId: null, categoryId: null, month: null, year: null };
    setDraftFilters(empty);
    setFilters(empty);
    setIsFilterModalVisible(false);
    setLoading(true);
  };

  // Delete Transaction Action
  const handleDelete = async () => {
    if (!transactionToDelete) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await api.delete(`/transactions/${transactionToDelete.id}`);

      setTransactions((prev) => prev.filter((t) => t.id !== transactionToDelete.id));
      setTransactionToDelete(null);
    } catch (err) {
      console.warn('[Transactions] Delete error:', err);
      setDeleteError(getErrorMessage(err, Strings.transactions.deleteError));
    } finally {
      setDeleting(false);
    }
  };

  // Group transactions by date for SectionList
  const groupedSections: DateGroup[] = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};

    transactions.forEach((tx) => {
      const dateKey = tx.transaction_date || formatDateToISO(new Date());
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(tx);
    });

    const sortedDateKeys = Object.keys(groups).sort((a, b) => (b > a ? 1 : -1));

    return sortedDateKeys.map((dateKey) => {
      const items = groups[dateKey];
      let totalIncome = 0;
      let totalExpense = 0;

      items.forEach((item) => {
        const amt = Number(item.amount) || 0;
        if (item.type === 'income') totalIncome += amt;
        else totalExpense += amt;
      });

      return {
        title: formatTransactionGroupDate(dateKey),
        dateKey,
        totalIncome,
        totalExpense,
        data: items,
      };
    });
  }, [transactions]);

  // Render Section Header (Date)
  const renderSectionHeader = ({ section }: { section: DateGroup }) => {
    return (
      <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons
            name="calendar-outline"
            size={14}
            color={theme.textSecondary}
            style={{ marginRight: 4 }}
          />
          <Text style={[Typography.subhead, styles.sectionTitle, { color: theme.textPrimary }]}>
            {section.title}
          </Text>
        </View>

        {/* Daily Net Summary Tag */}
        <View style={styles.dailySummaryRow}>
          {section.totalIncome > 0 && (
            <Text style={[Typography.caption, { color: theme.income, fontWeight: '700' }]}>
              +{formatCurrency(section.totalIncome, { showSymbol: false })}
            </Text>
          )}
          {section.totalIncome > 0 && section.totalExpense > 0 && (
            <Text style={[Typography.caption, { color: theme.textTertiary }]}> • </Text>
          )}
          {section.totalExpense > 0 && (
            <Text style={[Typography.caption, { color: theme.expense, fontWeight: '700' }]}>
              -{formatCurrency(section.totalExpense, { showSymbol: false })}
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <View>
          <Text
            style={[
              Typography.title1,
              styles.screenTitle,
              { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          >
            {Strings.transactions.title}
          </Text>
          <Text style={[Typography.caption, { color: theme.textSecondary }]}>
            {Strings.transactions.showingResults(transactions.length)}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Filter Button with badge */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={openFilterModal}
            style={[
              styles.filterBtn,
              {
                backgroundColor: activeFiltersCount > 0 ? theme.primaryMuted : theme.surface,
                borderColor: activeFiltersCount > 0 ? theme.primary : theme.border,
              },
            ]}
          >
            <Ionicons
              name="funnel-outline"
              size={18}
              color={activeFiltersCount > 0 ? theme.primary : theme.textSecondary}
            />
            <Text
              style={[
                Typography.caption,
                {
                  color: activeFiltersCount > 0 ? theme.primary : theme.textSecondary,
                  fontWeight: activeFiltersCount > 0 ? '700' : '500',
                  marginHorizontal: 4,
                },
              ]}
            >
              {Strings.transactions.filterAction}
            </Text>

            {activeFiltersCount > 0 && (
              <View style={[styles.filterBadge, { backgroundColor: theme.primary }]}>
                <Text style={[Typography.caption, styles.badgeText, { color: theme.textInverse }]}>
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Add Transaction Shortcut */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/transaction/new' as any)}
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="add" size={20} color={theme.textInverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filter Chips Bar */}
      {activeFiltersCount > 0 && (
        <View style={[styles.activeFiltersBar, { backgroundColor: theme.surfaceSubtle }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersScroll}>
            {filters.walletId && (
              <View style={[styles.activeChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[Typography.caption, { color: theme.textPrimary }]}>
                  {walletMap.get(filters.walletId)?.name || Strings.transactions.filterWallet}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setFilters((prev) => ({ ...prev, walletId: null }));
                    setLoading(true);
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={14} color={theme.textTertiary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            )}

            {filters.categoryId && (
              <View style={[styles.activeChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[Typography.caption, { color: theme.textPrimary }]}>
                  {categoryMap.get(filters.categoryId)?.name || Strings.transactions.filterCategory}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setFilters((prev) => ({ ...prev, categoryId: null }));
                    setLoading(true);
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={14} color={theme.textTertiary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            )}

            {filters.month !== null && filters.year !== null && (
              <View style={[styles.activeChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[Typography.caption, { color: theme.textPrimary }]}>
                  {ARABIC_MONTHS[filters.month - 1]} {filters.year}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setFilters((prev) => ({ ...prev, month: null, year: null }));
                    setLoading(true);
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close-circle" size={14} color={theme.textTertiary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={resetFilters} style={styles.clearAllFiltersBtn}>
              <Text style={[Typography.caption, { color: theme.expense, fontWeight: '700' }]}>
                {Strings.transactions.resetFilters}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Main Content Area */}
      {loading ? (
        <LoadingView />
      ) : fetchError && transactions.length === 0 ? (
        <EmptyState
          icon="alert-circle-outline"
          title={fetchError}
          subtitle={Strings.common.networkError}
          actionTitle={Strings.common.retry}
          onAction={() => fetchTransactions(0)}
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={
            activeFiltersCount > 0
              ? Strings.transactions.emptyFiltered
              : Strings.transactions.emptyTransactions
          }
          subtitle={
            activeFiltersCount > 0
              ? Strings.transactions.resetFilterPrompt
              : Strings.home.noTransactionsSubtitle
          }
          actionTitle={
            activeFiltersCount > 0
              ? Strings.transactions.resetFilters
              : Strings.transactions.addTransaction
          }
          onAction={
            activeFiltersCount > 0
              ? resetFilters
              : () => router.push('/transaction/new' as any)
          }
        />
      ) : (
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const category = item.category_id ? categoryMap.get(item.category_id) : undefined;
            const wallet = item.wallet_id ? walletMap.get(item.wallet_id) : undefined;

            return (
              <TransactionItem
                transaction={item}
                categoryName={category?.name || Strings.transactions.uncategorized}
                categoryIcon={category?.icon}
                walletName={wallet?.name || Strings.home.walletDefault}
                showDate={false}
                onPress={() => {
                  router.push({
                    pathname: '/transaction/new',
                    params: {
                      id: item.id,
                      initialData: JSON.stringify(item),
                    },
                  });
                }}
                onDelete={() => setTransactionToDelete(item)}
              />
            );
          }}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            fetchError ? (
              <View style={{ marginBottom: Spacing.md }}>
                <ErrorBanner message={fetchError} onDismiss={() => setFetchError(null)} />
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.primary} />
              </View>
            ) : null
          }
        />
      )}

      {/* FILTER MODAL SHEET */}
      <TransactionFilterModal
        visible={isFilterModalVisible}
        wallets={wallets}
        categories={categories}
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        onApply={applyFilters}
        onClose={() => setIsFilterModalVisible(false)}
        onReset={resetFilters}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        visible={Boolean(transactionToDelete)}
        title={Strings.transactions.deleteConfirmTitle}
        message={
          transactionToDelete
            ? Strings.transactions.deleteConfirmBody(
                formatCurrency(Number(transactionToDelete.amount)),
                walletMap.get(transactionToDelete.wallet_id)?.name
              )
            : ''
        }
        confirmLabel={Strings.transactions.confirmDelete}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => setTransactionToDelete(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  screenTitle: {
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  activeFiltersBar: {
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.lg,
  },
  activeFiltersScroll: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  clearAllFiltersBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
  },
  dailySummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerLoader: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});
