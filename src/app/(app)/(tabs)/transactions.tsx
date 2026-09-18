import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
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
  Shadows,
  BrandColors,
} from '../../../constants/theme';
import { Strings } from '../../../constants/strings';
import { Button } from '../../../components/ui';
import { EmptyState } from '../../../components/home';
import api from '../../../services/api';
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

interface FilterState {
  walletId: string | null;
  categoryId: string | null;
  month: number | null; // 1-12
  year: number | null;
}

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
      console.warn('[Transactions] Error loading wallets/categories:', err);
    }
  }, []);

  // Fetch Transactions with pagination & active filters
  const fetchTransactions = useCallback(
    async (offset = 0, isRefresh = false) => {
      try {
        if (offset === 0 && !isRefresh) {
          setLoading(true);
        }

        const queryParts: string[] = [`limit=${PAGE_SIZE}`, `offset=${offset}`];
        if (filters.walletId) queryParts.push(`wallet_id=${filters.walletId}`);
        if (filters.categoryId) queryParts.push(`category_id=${filters.categoryId}`);
        if (filters.month !== null && filters.year !== null) {
          queryParts.push(`month=${filters.month}`);
          queryParts.push(`year=${filters.year}`);
        }

        const url = `/transactions?${queryParts.join('&')}`;
        const res = await api.get<GetTransactionsResponse>(url);
        const fetched = res.data?.transactions || [];

        if (offset === 0) {
          setTransactions(fetched);
        } else {
          setTransactions((prev) => [...prev, ...fetched]);
        }

        setHasMore(fetched.length >= PAGE_SIZE);
      } catch (err) {
        console.warn('[Transactions] Error fetching transactions:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filters]
  );

  // Focus effect: whenever screen becomes active, refresh to reflect any new/updated/deleted transactions
  useFocusEffect(
    useCallback(() => {
      loadAuxData();
      fetchTransactions(0, true);
    }, [loadAuxData, fetchTransactions])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadAuxData();
    fetchTransactions(0, true);
  };

  // Load More (Pagination)
  const onLoadMore = () => {
    if (loadingMore || !hasMore || loading) return;
    setLoadingMore(true);
    fetchTransactions(transactions.length);
  };

  // Group transactions by date
  const groupedSections: DateGroup[] = useMemo(() => {
    const groups: { [key: string]: DateGroup } = {};

    for (const tx of transactions) {
      const dateKey = tx.transaction_date.slice(0, 10);
      if (!groups[dateKey]) {
        groups[dateKey] = {
          title: formatTransactionGroupDate(dateKey),
          dateKey,
          totalIncome: 0,
          totalExpense: 0,
          data: [],
        };
      }

      groups[dateKey].data.push(tx);
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') {
        groups[dateKey].totalIncome += amt;
      } else {
        groups[dateKey].totalExpense += amt;
      }
    }

    // Convert map to sorted array by dateKey descending
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => groups[key]);
  }, [transactions]);

  // Open Filter Modal
  const openFilterModal = () => {
    setDraftFilters({ ...filters });
    setIsFilterModalVisible(true);
  };

  // Apply Filters
  const applyFilters = () => {
    setFilters({ ...draftFilters });
    setIsFilterModalVisible(false);
    setLoading(true);
  };

  // Reset Filters
  const resetFilters = () => {
    const emptyFilter: FilterState = {
      walletId: null,
      categoryId: null,
      month: null,
      year: null,
    };
    setDraftFilters(emptyFilter);
    setFilters(emptyFilter);
    setIsFilterModalVisible(false);
    setLoading(true);
  };

  // Handle Delete Confirmation
  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      await api.delete(`/transactions/${transactionToDelete.id}`);

      // Optimistically remove from state
      setTransactions((prev) => prev.filter((t) => t.id !== transactionToDelete.id));
      setTransactionToDelete(null);

      // Refresh wallets balance in background
      loadAuxData();
    } catch (err: any) {
      console.warn('[Transactions] Error deleting transaction:', err);
      setDeleteError(Strings.transactions.deleteError);
    } finally {
      setDeleting(false);
    }
  };

  // Helper for quick date shortcuts in filter
  const applyCurrentMonthFilter = () => {
    const now = new Date();
    setDraftFilters((prev) => ({
      ...prev,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    }));
  };

  const applyLastMonthFilter = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setDraftFilters((prev) => ({
      ...prev,
      month: lastMonth.getMonth() + 1,
      year: lastMonth.getFullYear(),
    }));
  };

  // Render a Transaction Row
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === 'income';
    const amountColor = isIncome ? theme.income : theme.expense;
    const sign = isIncome ? '+' : '-';

    const category = item.category_id ? categoryMap.get(item.category_id) : undefined;
    const wallet = walletMap.get(item.wallet_id);

    const categoryName = category?.name || Strings.transactions.uncategorized;
    const walletName = wallet?.name || Strings.home.walletDefault;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => {
          // Tap transaction -> open edit screen pre-filled
          router.push({
            pathname: '/transaction/new',
            params: {
              id: item.id,
              initialData: JSON.stringify(item),
            },
          });
        }}
        style={[
          styles.transactionRow,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
          Shadows.subtle,
        ]}
      >
        {/* Category Icon Badge */}
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: isIncome ? `${theme.income}18` : `${theme.expense}18`,
            },
          ]}
        >
          <Ionicons
            name={
              category?.icon
                ? (category.icon as any)
                : isIncome
                ? 'arrow-down'
                : 'arrow-up'
            }
            size={18}
            color={amountColor}
          />
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          <Text
            style={[Typography.bodyMedium, styles.rowTitle, { color: theme.textPrimary }]}
            numberOfLines={1}
          >
            {categoryName}
          </Text>

          {item.note ? (
            <Text
              style={[Typography.caption, styles.rowNote, { color: theme.textSecondary }]}
              numberOfLines={1}
            >
              {item.note}
            </Text>
          ) : null}

          <View style={styles.rowMetaLine}>
            <Ionicons
              name="wallet-outline"
              size={12}
              color={theme.textTertiary}
              style={{ marginRight: 3 }}
            />
            <Text style={[Typography.caption, { color: theme.textTertiary, fontSize: 11 }]}>
              {walletName}
            </Text>
          </View>
        </View>

        {/* Amount & Delete Action */}
        <View style={styles.rightCol}>
          <Text style={[Typography.subhead, styles.rowAmount, { color: amountColor }]}>
            {sign} {formatCurrency(Number(item.amount))}
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={(e) => {
              e.stopPropagation();
              setTransactionToDelete(item);
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.deleteBtn, { backgroundColor: theme.surfaceSubtle }]}
          >
            <Ionicons name="trash-outline" size={14} color={theme.expense} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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

      {/* Active Filter Chips Bar (Visible when filters applied) */}
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

      {/* Main List Area */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[Typography.caption, { color: theme.textSecondary, marginTop: Spacing.sm }]}>
            {Strings.common.loading}
          </Text>
        </View>
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
          onAction={() => {
            if (activeFiltersCount > 0) {
              resetFilters();
            } else {
              router.push('/transaction/new' as any);
            }
          }}
        />
      ) : (
        <SectionList
          sections={groupedSections}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[Typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>
                  {Strings.transactions.loadMore}
                </Text>
              </View>
            ) : (
              <View style={{ height: Spacing.xl }} />
            )
          }
        />
      )}

      {/* FILTER MODAL SHEET */}
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={[styles.filterBackdrop, { backgroundColor: theme.modalBackdrop }]}>
          <View
            style={[
              styles.filterSheet,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.elevated,
            ]}
          >
            {/* Filter Header */}
            <View style={[styles.filterSheetHeader, { borderBottomColor: theme.border }]}>
              <Text style={[Typography.title3, { color: theme.textPrimary, fontWeight: '700' }]}>
                {Strings.transactions.filterTitle}
              </Text>
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                style={[styles.closeFilterBtn, { backgroundColor: theme.surfaceSubtle }]}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.filterSheetBody}
            >
              {/* Filter 1: By Wallet */}
              <View style={styles.filterSection}>
                <Text style={[Typography.subhead, styles.filterSectionTitle, { color: theme.textPrimary }]}>
                  {Strings.transactions.filterWallet}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {/* All Wallets Option */}
                  <TouchableOpacity
                    onPress={() => setDraftFilters((prev) => ({ ...prev, walletId: null }))}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: draftFilters.walletId === null ? theme.primaryMuted : theme.surfaceSubtle,
                        borderColor: draftFilters.walletId === null ? theme.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        Typography.caption,
                        {
                          color: draftFilters.walletId === null ? theme.primary : theme.textPrimary,
                          fontWeight: draftFilters.walletId === null ? '700' : '500',
                        },
                      ]}
                    >
                      {Strings.transactions.allWallets}
                    </Text>
                  </TouchableOpacity>

                  {wallets.map((w) => {
                    const isSelected = draftFilters.walletId === w.id;
                    return (
                      <TouchableOpacity
                        key={w.id}
                        onPress={() => setDraftFilters((prev) => ({ ...prev, walletId: w.id }))}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: isSelected ? theme.primaryMuted : theme.surfaceSubtle,
                            borderColor: isSelected ? theme.primary : 'transparent',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            Typography.caption,
                            {
                              color: isSelected ? theme.primary : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {w.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Filter 2: By Category */}
              <View style={styles.filterSection}>
                <Text style={[Typography.subhead, styles.filterSectionTitle, { color: theme.textPrimary }]}>
                  {Strings.transactions.filterCategory}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
                  {/* All Categories Option */}
                  <TouchableOpacity
                    onPress={() => setDraftFilters((prev) => ({ ...prev, categoryId: null }))}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: draftFilters.categoryId === null ? theme.primaryMuted : theme.surfaceSubtle,
                        borderColor: draftFilters.categoryId === null ? theme.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        Typography.caption,
                        {
                          color: draftFilters.categoryId === null ? theme.primary : theme.textPrimary,
                          fontWeight: draftFilters.categoryId === null ? '700' : '500',
                        },
                      ]}
                    >
                      {Strings.transactions.allCategories}
                    </Text>
                  </TouchableOpacity>

                  {categories.map((c) => {
                    const isSelected = draftFilters.categoryId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        onPress={() => setDraftFilters((prev) => ({ ...prev, categoryId: c.id }))}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: isSelected ? theme.primaryMuted : theme.surfaceSubtle,
                            borderColor: isSelected ? theme.primary : 'transparent',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            Typography.caption,
                            {
                              color: isSelected ? theme.primary : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Filter 3: By Month & Year */}
              <View style={styles.filterSection}>
                <Text style={[Typography.subhead, styles.filterSectionTitle, { color: theme.textPrimary }]}>
                  {Strings.transactions.filterTime}
                </Text>

                {/* Quick Period Buttons */}
                <View style={styles.periodShortcutsRow}>
                  {/* All Time */}
                  <TouchableOpacity
                    onPress={() => setDraftFilters((prev) => ({ ...prev, month: null, year: null }))}
                    style={[
                      styles.periodShortcutBtn,
                      {
                        backgroundColor:
                          draftFilters.month === null ? theme.primaryMuted : theme.surfaceSubtle,
                        borderColor: draftFilters.month === null ? theme.primary : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        Typography.caption,
                        {
                          color: draftFilters.month === null ? theme.primary : theme.textPrimary,
                          fontWeight: draftFilters.month === null ? '700' : '500',
                        },
                      ]}
                    >
                      {Strings.transactions.allTime}
                    </Text>
                  </TouchableOpacity>

                  {/* This Month */}
                  <TouchableOpacity
                    onPress={applyCurrentMonthFilter}
                    style={[
                      styles.periodShortcutBtn,
                      {
                        backgroundColor:
                          draftFilters.month === new Date().getMonth() + 1 &&
                          draftFilters.year === new Date().getFullYear()
                            ? theme.primaryMuted
                            : theme.surfaceSubtle,
                        borderColor:
                          draftFilters.month === new Date().getMonth() + 1 &&
                          draftFilters.year === new Date().getFullYear()
                            ? theme.primary
                            : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        Typography.caption,
                        {
                          color:
                            draftFilters.month === new Date().getMonth() + 1 &&
                            draftFilters.year === new Date().getFullYear()
                              ? theme.primary
                              : theme.textPrimary,
                          fontWeight:
                            draftFilters.month === new Date().getMonth() + 1 &&
                            draftFilters.year === new Date().getFullYear()
                              ? '700'
                              : '500',
                        },
                      ]}
                    >
                      {Strings.transactions.thisMonth}
                    </Text>
                  </TouchableOpacity>

                  {/* Last Month */}
                  <TouchableOpacity
                    onPress={applyLastMonthFilter}
                    style={[
                      styles.periodShortcutBtn,
                      {
                        backgroundColor:
                          draftFilters.month ===
                            new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getMonth() + 1 &&
                          draftFilters.year ===
                            new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getFullYear()
                            ? theme.primaryMuted
                            : theme.surfaceSubtle,
                        borderColor:
                          draftFilters.month ===
                            new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getMonth() + 1 &&
                          draftFilters.year ===
                            new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getFullYear()
                            ? theme.primary
                            : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        Typography.caption,
                        {
                          color:
                            draftFilters.month ===
                              new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getMonth() + 1 &&
                            draftFilters.year ===
                              new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getFullYear()
                                ? theme.primary
                                : theme.textPrimary,
                          fontWeight:
                            draftFilters.month ===
                              new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getMonth() + 1 &&
                            draftFilters.year ===
                              new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getFullYear()
                                ? '700'
                                : '500',
                        },
                      ]}
                    >
                      {Strings.transactions.lastMonth}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Month Grid Picker */}
                <Text style={[Typography.caption, { color: theme.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.sm }]}>
                  {Strings.transactions.monthLabel} (2026)
                </Text>
                <View style={styles.monthsGrid}>
                  {ARABIC_MONTHS.map((mName, index) => {
                    const mNum = index + 1;
                    const isSelected = draftFilters.month === mNum && draftFilters.year === 2026;
                    return (
                      <TouchableOpacity
                        key={mName}
                        onPress={() => {
                          setDraftFilters((prev) => ({
                            ...prev,
                            month: mNum,
                            year: 2026,
                          }));
                        }}
                        style={[
                          styles.monthGridCell,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.surfaceSubtle,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            Typography.caption,
                            {
                              color: isSelected ? theme.textInverse : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {mName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Filter Action Buttons */}
            <View style={[styles.filterSheetFooter, { borderTopColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Button
                  title={Strings.transactions.applyFilters}
                  onPress={applyFilters}
                  variant="primary"
                />
              </View>
              <View style={{ width: Spacing.sm }} />
              <View style={{ flex: 0.6 }}>
                <Button
                  title={Strings.transactions.resetFilters}
                  onPress={resetFilters}
                  variant="ghost"
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG */}
      <Modal
        visible={Boolean(transactionToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => setTransactionToDelete(null)}
      >
        <View style={[styles.deleteBackdrop, { backgroundColor: theme.modalBackdrop }]}>
          <View
            style={[
              styles.deleteDialogCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.elevated,
            ]}
          >
            <View style={[styles.deleteWarningIconWrapper, { backgroundColor: theme.expenseBg }]}>
              <Ionicons name="trash-outline" size={32} color={theme.expense} />
            </View>

            <Text style={[Typography.title3, styles.deleteDialogTitle, { color: theme.textPrimary }]}>
              {Strings.transactions.deleteConfirmTitle}
            </Text>

            {transactionToDelete && (
              <Text style={[Typography.bodyMedium, styles.deleteDialogBody, { color: theme.textSecondary }]}>
                {Strings.transactions.deleteConfirmBody(
                  formatCurrency(Number(transactionToDelete.amount)),
                  walletMap.get(transactionToDelete.wallet_id)?.name
                )}
              </Text>
            )}

            {deleteError && (
              <Text style={[Typography.caption, { color: theme.expense, marginBottom: Spacing.sm }]}>
                {deleteError}
              </Text>
            )}

            <View style={styles.deleteDialogActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={deleting}
                onPress={confirmDeleteTransaction}
                style={[styles.deleteConfirmBtn, { backgroundColor: theme.expense }]}
              >
                {deleting ? (
                  <ActivityIndicator color={theme.textInverse} size="small" />
                ) : (
                  <Text style={[Typography.headline, { color: theme.textInverse, fontWeight: '700' }]}>
                    {Strings.transactions.confirmDelete}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={deleting}
                onPress={() => setTransactionToDelete(null)}
                style={styles.deleteCancelBtn}
              >
                <Text style={[Typography.bodyMedium, { color: theme.textSecondary }]}>
                  {Strings.transactions.cancel}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
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
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  activeFiltersBar: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  activeFiltersScroll: {
    flexDirection: 'row',
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
  },
  clearAllFiltersBtn: {
    paddingHorizontal: Spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 90,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
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
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  rowTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  rowNote: {
    fontSize: 12,
    marginBottom: 2,
  },
  rowMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: Spacing.sm,
  },
  rowAmount: {
    fontWeight: '700',
    marginBottom: 4,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listFooter: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  filterBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterSheet: {
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    borderWidth: 1,
    maxHeight: '80%',
  },
  filterSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  closeFilterBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterSheetBody: {
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterSectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  chipsScroll: {
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: 1.5,
  },
  periodShortcutsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  periodShortcutBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radii.md,
    borderWidth: 1.5,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  monthGridCell: {
    width: '23%',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radii.md,
  },
  filterSheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  deleteBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  deleteDialogCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  deleteWarningIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  deleteDialogTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  deleteDialogBody: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  deleteDialogActions: {
    width: '100%',
    gap: Spacing.xs,
  },
  deleteConfirmBtn: {
    height: 48,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteCancelBtn: {
    height: 44,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
