import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ThemeColors,
  Typography,
  Spacing,
  Radii,
  Shadows,
} from '../../../constants/theme';
import { Strings } from '../../../constants/strings';
import {
  Button,
  ErrorBanner,
  MonthYearSelector,
  LoadingView,
  ConfirmModal,
  ProgressBar,
  EmptyState,
  CategoryBudgetCard,
  BudgetFormModal,
} from '../../../components';
import api from '../../../services/api';
import { BudgetSummaryItem, Category } from '../../../types/models';
import {
  GetBudgetSummaryResponse,
  GetCategoriesResponse,
} from '../../../types/api';
import { formatCurrency } from '../../../utils/formatters';
import { useLanguage } from '../../../i18n';

export default function BudgetsScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { isRTL, strings, t } = useLanguage();

  // Selected Month/Year Period
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Summary & Categories Data
  const [summaryItems, setSummaryItems] = useState<BudgetSummaryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Add / Edit Modal State
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingItem, setEditingItem] = useState<BudgetSummaryItem | null>(null);
  const [formCategoryId, setFormCategoryId] = useState<string | null>(null);
  const [formAmountStr, setFormAmountStr] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<BudgetSummaryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Lookups
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Fetch Budgets Summary & Categories
  const fetchBudgetsData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setGeneralError(null);

      const [summaryRes, categoriesRes] = await Promise.all([
        api.get<GetBudgetSummaryResponse>(
          `/budgets/summary?month=${selectedMonth}&year=${selectedYear}`
        ),
        api.get<GetCategoriesResponse>('/categories'),
      ]);

      if (summaryRes.data?.summary) {
        setSummaryItems(summaryRes.data.summary);
      }
      if (categoriesRes.data?.categories) {
        setCategories(categoriesRes.data.categories);
      }
    } catch (err: any) {
      console.warn('[Budgets] Error fetching budgets data:', err);
      setGeneralError(err.response?.data?.error || strings.budgets.failedToLoadBudgets);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, selectedYear]);

  // Sync with focus
  useFocusEffect(
    useCallback(() => {
      fetchBudgetsData();
    }, [fetchBudgetsData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchBudgetsData(true);
  };

  // Separate Overall Budget vs Category Budgets
  const overallBudget = useMemo(
    () => summaryItems.find((b) => b.category_id === null) || null,
    [summaryItems]
  );

  const categoryBudgets = useMemo(
    () => summaryItems.filter((b) => b.category_id !== null),
    [summaryItems]
  );

  // Expense categories that do not already have a budget this period
  const budgetedCategoryIds = useMemo(
    () => new Set(categoryBudgets.map((b) => b.category_id)),
    [categoryBudgets]
  );

  const availableExpenseCategories = useMemo(
    () =>
      categories.filter(
        (c) => c.type === 'expense' && !budgetedCategoryIds.has(c.id)
      ),
    [categories, budgetedCategoryIds]
  );

  // Handlers for Add Modal
  const openAddModal = () => {
    setFormMode('add');
    setEditingItem(null);
    setFormAmountStr('');
    setFormError(null);
    setFormCategoryId(availableExpenseCategories[0]?.id || null);
    setIsFormModalVisible(true);
  };

  // Handlers for Edit Modal
  const openEditModal = (item: BudgetSummaryItem) => {
    setFormMode('edit');
    setEditingItem(item);
    setFormAmountStr(String(item.budgeted));
    setFormError(null);
    setFormCategoryId(item.category_id);
    setIsFormModalVisible(true);
  };

  // Save (Create or Update) Budget
  const handleSaveBudget = async () => {
    const numericAmount = parseFloat(formAmountStr);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError(strings.budgets.amountRequired);
      return;
    }

    if (formMode === 'add') {
      if (!formCategoryId) {
        setFormError(strings.budgets.categoryRequired);
        return;
      }
      try {
        setSubmitting(true);
        setFormError(null);
        await api.post('/budgets', {
          category_id: formCategoryId,
          amount: numericAmount,
          month: selectedMonth,
          year: selectedYear,
        });
        setIsFormModalVisible(false);
        fetchBudgetsData(true);
      } catch (err: any) {
        console.warn('[Budgets] Create budget error:', err);
        setFormError(err.response?.data?.error || strings.budgets.failedToCreateBudget);
      } finally {
        setSubmitting(false);
      }
    } else if (formMode === 'edit' && editingItem) {
      try {
        setSubmitting(true);
        setFormError(null);

        if (editingItem.budget_id) {
          await api.patch(`/budgets/${editingItem.budget_id}`, {
            amount: numericAmount,
          });
        } else {
          // If editing an auto-generated overall budget that wasn't persisted yet
          await api.post('/budgets', {
            category_id: editingItem.category_id,
            amount: numericAmount,
            month: selectedMonth,
            year: selectedYear,
          });
        }

        setIsFormModalVisible(false);
        fetchBudgetsData(true);
      } catch (err: any) {
        console.warn('[Budgets] Update budget error:', err);
        setFormError(err.response?.data?.error || strings.budgets.failedToUpdateBudget);
      } finally {
        setSubmitting(false);
      }
    }
  };

  // Delete Budget
  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem || !deleteConfirmItem.budget_id) return;
    try {
      setDeleting(true);
      await api.delete(`/budgets/${deleteConfirmItem.budget_id}`);
      setDeleteConfirmItem(null);
      setIsFormModalVisible(false);
      fetchBudgetsData(true);
    } catch (err: any) {
      console.warn('[Budgets] Delete budget error:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Helper for budget status calculations
  const getBudgetStatus = (budgeted: number, spent: number) => {
    const ratio = budgeted > 0 ? spent / budgeted : 0;
    const percentage = Math.round(ratio * 100);
    const isOver = spent > budgeted;

    let color = theme.income;
    let label: string = strings.budgets.statusFine;

    if (isOver) {
      color = theme.expense;
      label = strings.budgets.statusOver;
    } else if (percentage >= 80) {
      color = theme.warning;
      label = strings.budgets.statusWarning;
    }

    return { ratio, percentage, isOver, color, label };
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View>
          <Text
            style={[
              Typography.title1,
              styles.screenTitle,
              { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {strings.budgets.title}
          </Text>
          <Text style={[Typography.caption, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
            {strings.budgets.subtitle}
          </Text>
        </View>

        {/* Add Category Budget Action */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={openAddModal}
          style={[styles.addHeaderBtn, { backgroundColor: theme.primary, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={[Typography.caption, styles.addBtnText, { color: '#FFFFFF' }]}>
            {strings.budgets.addCategoryBudget}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month/Year Selector */}
      <MonthYearSelector
        month={selectedMonth}
        year={selectedYear}
        onChangeMonth={setSelectedMonth}
        onChangeYear={setSelectedYear}
      />

      {/* Main Content */}
      {loading ? (
        <LoadingView />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {generalError && (
            <View style={{ marginBottom: Spacing.md }}>
              <ErrorBanner message={generalError} onDismiss={() => setGeneralError(null)} />
              <TouchableOpacity
                onPress={() => fetchBudgetsData(false)}
                style={[styles.retryBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                <Text style={[Typography.caption, { color: theme.primary, fontWeight: '700', marginHorizontal: 6 }]}>
                  {Strings.common.retry}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* OVERALL BUDGET HERO CARD */}
          {overallBudget ? (
            (() => {
              const status = getBudgetStatus(overallBudget.budgeted, overallBudget.spent);
              const clampedProgress = Math.min(Math.max(status.ratio, 0), 1);

              return (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => openEditModal(overallBudget)}
                  style={[
                    styles.heroCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: status.isOver ? theme.expense : theme.border,
                    },
                    Shadows.elevated,
                  ]}
                >
                  <View style={[styles.heroTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={styles.heroTitleCol}>
                      <Text style={[Typography.headline, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                        {strings.budgets.overallBudget}
                      </Text>
                      <Text style={[Typography.caption, { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                        {strings.budgets.overallBudgetSubtitle}
                      </Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: `${status.color}15`, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={[Typography.caption, { color: status.color, fontWeight: '700' }]}>
                        {status.label} ({status.percentage}%)
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <ProgressBar
                    progress={clampedProgress}
                    color={status.color}
                    height={10}
                    style={{ marginVertical: Spacing.md }}
                  />

                  {/* 3-column stats */}
                  <View style={[styles.statsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={styles.statCol}>
                      <Text style={[Typography.caption, { color: theme.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
                        {strings.budgets.budgeted}
                      </Text>
                      <Text
                        style={[
                          Typography.subhead,
                          styles.statValue,
                          { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
                        ]}
                      >
                        {formatCurrency(overallBudget.budgeted)}
                      </Text>
                    </View>

                    <View style={styles.statCol}>
                      <Text style={[Typography.caption, { color: theme.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
                        {strings.budgets.spent}
                      </Text>
                      <Text
                        style={[
                          Typography.subhead,
                          styles.statValue,
                          { color: status.isOver ? theme.expense : theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
                        ]}
                      >
                        {formatCurrency(overallBudget.spent)}
                      </Text>
                    </View>

                    <View style={styles.statCol}>
                      <Text style={[Typography.caption, { color: theme.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
                        {strings.budgets.remaining}
                      </Text>
                      <Text
                        style={[
                          Typography.subhead,
                          styles.statValue,
                          {
                            color: overallBudget.remaining >= 0 ? theme.income : theme.expense,
                            textAlign: isRTL ? 'right' : 'left',
                          },
                        ]}
                      >
                        {formatCurrency(overallBudget.remaining)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.editHintRow, { borderTopColor: theme.borderSubtle, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                      {strings.budgets.tapToEditOverall}
                    </Text>
                    <Ionicons name="pencil-outline" size={14} color={theme.textTertiary} />
                  </View>
                </TouchableOpacity>
              );
            })()
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setFormMode('edit');
                setEditingItem({
                  budget_id: null,
                  category_id: null,
                  budgeted: 0,
                  spent: 0,
                  remaining: 0,
                });
                setFormAmountStr('');
                setFormError(null);
                setFormCategoryId(null);
                setIsFormModalVisible(true);
              }}
              style={[styles.emptyOverallCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
            >
              <Ionicons name="pie-chart-outline" size={32} color={theme.primary} />
              <Text style={[Typography.subhead, { color: theme.textPrimary, fontWeight: '700', marginTop: Spacing.xs }]}>
                {strings.home.noBudgetSet}
              </Text>
              <Text style={[Typography.caption, { color: theme.primary, marginTop: 2, fontWeight: '600' }]}>
                {strings.home.setBudgetPrompt}
              </Text>
            </TouchableOpacity>
          )}

          {/* CATEGORY BUDGETS SECTION */}
          <View style={[styles.sectionHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[Typography.headline, styles.sectionTitle, { color: theme.textPrimary }]}>
              {strings.budgets.categoryBudgetsTitle}
            </Text>
            <Text style={[Typography.caption, { color: theme.textSecondary }]}>
              {t('budgets.budgetsCount', { count: categoryBudgets.length })}
            </Text>
          </View>

          {categoryBudgets.length === 0 ? (
            <EmptyState
              icon="pie-chart-outline"
              title={strings.budgets.noCategoryBudgets}
              subtitle={strings.budgets.noCategoryBudgetsSubtitle}
              actionTitle={strings.budgets.addCategoryBudget}
              onAction={openAddModal}
            />
          ) : (
            <View style={styles.categoryBudgetsList}>
              {categoryBudgets.map((item) => {
                const category = item.category_id ? categoryMap.get(item.category_id) : undefined;
                return (
                  <CategoryBudgetCard
                    key={item.budget_id}
                    item={item}
                    category={category}
                    onPress={() => openEditModal(item)}
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* ADD / EDIT BUDGET MODAL */}
      <BudgetFormModal
        visible={isFormModalVisible}
        mode={formMode}
        editingItem={editingItem}
        categoryName={
          editingItem?.category_id
            ? categoryMap.get(editingItem.category_id)?.name
            : undefined
        }
        availableCategories={availableExpenseCategories}
        selectedCategoryId={formCategoryId}
        onSelectCategory={(id) => setFormCategoryId(id)}
        amountStr={formAmountStr}
        onChangeAmount={setFormAmountStr}
        error={formError}
        onDismissError={() => setFormError(null)}
        submitting={submitting}
        onSubmit={handleSaveBudget}
        onClose={() => setIsFormModalVisible(false)}
        onDelete={
          formMode === 'edit' && editingItem?.budget_id
            ? () => setDeleteConfirmItem(editingItem)
            : undefined
        }
      />

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmModal
        visible={Boolean(deleteConfirmItem)}
        title={strings.budgets.deleteConfirmTitle}
        message={
          deleteConfirmItem
            ? deleteConfirmItem.category_id === null
              ? `${t('budgets.deleteConfirmBody', { name: strings.budgets.overallBudget })} ${strings.budgets.deleteOverallNote}`
              : t('budgets.deleteConfirmBody', {
                  name: categoryMap.get(deleteConfirmItem.category_id || '')?.name || '',
                })
            : ''
        }
        confirmLabel={strings.budgets.confirmDelete}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmItem(null)}
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
  addHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    gap: 4,
  },
  addBtnText: {
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginTop: Spacing.xs,
    alignSelf: 'center',
  },
  heroCard: {
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  heroTitleCol: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statValue: {
    fontWeight: '700',
    marginTop: 2,
  },
  editHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    marginTop: Spacing.md,
  },
  emptyOverallCard: {
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  categoryBudgetsList: {
    gap: Spacing.xs,
  },
});
