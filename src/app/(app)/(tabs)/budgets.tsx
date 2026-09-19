import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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
  BrandColors,
} from '../../../constants/theme';
import { Strings } from '../../../constants/strings';
import { Button, ErrorBanner, MonthYearSelector } from '../../../components/ui';
import { EmptyState } from '../../../components/home';
import api from '../../../services/api';
import { BudgetSummaryItem, Category } from '../../../types/models';
import {
  GetBudgetSummaryResponse,
  GetCategoriesResponse,
} from '../../../types/api';
import { formatCurrency } from '../../../utils/formatters';

export default function BudgetsScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  // Selected Month & Year
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data States
  const [summaryItems, setSummaryItems] = useState<BudgetSummaryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Add Category Budget Modal State
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addCategoryId, setAddCategoryId] = useState<string | null>(null);
  const [addAmountStr, setAddAmountStr] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit / Delete Modal State
  const [editingItem, setEditingItem] = useState<BudgetSummaryItem | null>(null);
  const [editAmountStr, setEditAmountStr] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete Confirmation Modal State
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
      setGeneralError(err.response?.data?.error || 'تعذر تحميل بيانات الميزانيات');
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

  // Separate Overall Budget (category_id: null) vs Category Budgets
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

  // Handlers for Adding Budget
  const openAddModal = () => {
    setAddCategoryId(availableExpenseCategories[0]?.id || null);
    setAddAmountStr('');
    setAddError(null);
    setIsAddModalVisible(true);
  };

  const handleCreateBudget = async () => {
    if (!addCategoryId) {
      setAddError(Strings.budgets.categoryRequired);
      return;
    }
    const amountNum = parseFloat(addAmountStr);
    if (!addAmountStr.trim() || isNaN(amountNum) || amountNum <= 0) {
      setAddError(Strings.budgets.amountRequired);
      return;
    }

    setAddSubmitting(true);
    setAddError(null);

    try {
      await api.post('/budgets', {
        category_id: addCategoryId,
        amount: amountNum,
        month: selectedMonth,
        year: selectedYear,
      });

      setIsAddModalVisible(false);
      fetchBudgetsData(true);
    } catch (err: any) {
      console.warn('[Budgets] Create budget error:', err);
      if (err.response?.data?.error) {
        setAddError(err.response.data.error);
      } else {
        setAddError('تعذر إضافة الميزانية');
      }
    } finally {
      setAddSubmitting(false);
    }
  };

  // Handlers for Editing Budget
  const openEditModal = (item: BudgetSummaryItem) => {
    setEditingItem(item);
    setEditAmountStr(String(item.budgeted));
    setEditError(null);
  };

  const handleUpdateBudget = async () => {
    if (!editingItem) return;
    const amountNum = parseFloat(editAmountStr);
    if (!editAmountStr.trim() || isNaN(amountNum) || amountNum <= 0) {
      setEditError(Strings.budgets.amountRequired);
      return;
    }

    setEditSubmitting(true);
    setEditError(null);

    try {
      await api.patch(`/budgets/${editingItem.budget_id}`, {
        amount: amountNum,
      });

      setEditingItem(null);
      fetchBudgetsData(true);
    } catch (err: any) {
      console.warn('[Budgets] Update budget error:', err);
      setEditError(err.response?.data?.error || 'تعذر تحديث الميزانية');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handlers for Deleting Budget
  const handleDeleteBudget = async () => {
    if (!deleteConfirmItem) return;
    setDeleting(true);

    try {
      await api.delete(`/budgets/${deleteConfirmItem.budget_id}`);
      setDeleteConfirmItem(null);
      setEditingItem(null);
      fetchBudgetsData(true);
    } catch (err: any) {
      console.warn('[Budgets] Delete budget error:', err);
      setGeneralError(err.response?.data?.error || 'تعذر حذف الميزانية');
    } finally {
      setDeleting(false);
    }
  };

  // Color & Status Helper for Budget Progress
  const getBudgetStatus = (budgeted: number, spent: number) => {
    if (budgeted <= 0) {
      return {
        ratio: 0,
        percentage: 0,
        color: theme.income,
        bg: theme.incomeBg,
        statusText: Strings.budgets.statusFine,
        isOver: false,
      };
    }
    const ratio = spent / budgeted;
    const percentage = Math.round(ratio * 100);
    const isOver = spent > budgeted;

    let color: string = theme.income;
    let bg: string = theme.incomeBg;
    let statusText: string = Strings.budgets.statusFine;

    if (isOver) {
      color = theme.expense;
      bg = theme.expenseBg;
      statusText = Strings.budgets.statusOver;
    } else if (ratio >= 0.8) {
      color = theme.warning;
      bg = theme.warningBg;
      statusText = Strings.budgets.statusWarning;
    }

    return { ratio, percentage, color, bg, statusText, isOver };
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <Text
          style={[
            Typography.title1,
            styles.screenTitle,
            { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        >
          {Strings.budgets.title}
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={openAddModal}
          style={[styles.headerAddBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={20} color={theme.textInverse} />
          <Text style={[Typography.caption, { color: theme.textInverse, fontWeight: '700', marginLeft: 4 }]}>
            {Strings.budgets.addCategoryBudget}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month/Year Navigation Selector */}
      <MonthYearSelector
        month={selectedMonth}
        year={selectedYear}
        mode="month"
        onChangeMonth={setSelectedMonth}
        onChangeYear={setSelectedYear}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[Typography.caption, { color: theme.textSecondary, marginTop: Spacing.sm }]}>
            {Strings.common.loading}
          </Text>
        </View>
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
              <ErrorBanner
                message={generalError}
                onDismiss={() => setGeneralError(null)}
              />
            </View>
          )}

          {/* PRIMARY HERO: Overall Budget Card */}
          {overallBudget && (() => {
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
                  Shadows.card,
                ]}
              >
                {/* Hero Header */}
                <View style={styles.heroHeaderRow}>
                  <View style={styles.heroTitleCol}>
                    <View style={styles.heroBadgeRow}>
                      <View style={[styles.heroIconBadge, { backgroundColor: theme.primaryMuted }]}>
                        <Ionicons name="pie-chart" size={18} color={theme.primary} />
                      </View>
                      <Text style={[Typography.title3, styles.heroTitle, { color: theme.textPrimary }]}>
                        {Strings.budgets.overallBudgetTitle}
                      </Text>
                    </View>
                    <Text style={[Typography.caption, { color: theme.textSecondary, marginTop: 2 }]}>
                      {Strings.budgets.overallBudgetSubtitle}
                    </Text>
                  </View>

                  {/* Status & Percent Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[Typography.caption, { color: status.color, fontWeight: '700' }]}>
                      {status.statusText} • {status.percentage}%
                    </Text>
                  </View>
                </View>

                {/* Over Budget Alert Notice */}
                {status.isOver && (
                  <View style={[styles.warningBanner, { backgroundColor: `${theme.expense}15` }]}>
                    <Ionicons name="alert-circle" size={16} color={theme.expense} />
                    <Text style={[Typography.caption, { color: theme.expense, fontWeight: '600', marginLeft: 4 }]}>
                      {Strings.budgets.overBudgetBy(
                        formatCurrency(overallBudget.spent - overallBudget.budgeted)
                      )}
                    </Text>
                  </View>
                )}

                {/* Big Progress Bar */}
                <View style={[styles.heroProgressTrack, { backgroundColor: theme.surfaceSubtle }]}>
                  <View
                    style={[
                      styles.heroProgressFill,
                      {
                        width: `${clampedProgress * 100}%`,
                        backgroundColor: status.color,
                      },
                    ]}
                  />
                </View>

                {/* 3-Column Stats Breakdown */}
                <View style={styles.statsRow}>
                  {/* Budgeted */}
                  <View style={styles.statCol}>
                    <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                      {Strings.budgets.budgeted}
                    </Text>
                    <Text style={[Typography.subhead, styles.statValue, { color: theme.textPrimary }]}>
                      {formatCurrency(overallBudget.budgeted)}
                    </Text>
                  </View>

                  {/* Spent */}
                  <View style={styles.statCol}>
                    <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                      {Strings.budgets.spent}
                    </Text>
                    <Text
                      style={[
                        Typography.subhead,
                        styles.statValue,
                        { color: status.isOver ? theme.expense : theme.textPrimary },
                      ]}
                    >
                      {formatCurrency(overallBudget.spent)}
                    </Text>
                  </View>

                  {/* Remaining */}
                  <View style={styles.statCol}>
                    <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                      {Strings.budgets.remaining}
                    </Text>
                    <Text
                      style={[
                        Typography.subhead,
                        styles.statValue,
                        {
                          color: overallBudget.remaining >= 0 ? theme.income : theme.expense,
                        },
                      ]}
                    >
                      {formatCurrency(overallBudget.remaining)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.editHintRow, { borderTopColor: theme.borderSubtle }]}>
                  <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                    اضغط لتعديل سقف الميزانية العامة
                  </Text>
                  <Ionicons name="pencil-outline" size={14} color={theme.textTertiary} />
                </View>
              </TouchableOpacity>
            );
          })()}

          {/* CATEGORY BUDGETS SECTION */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[Typography.headline, styles.sectionTitle, { color: theme.textPrimary }]}>
              {Strings.budgets.categoryBudgetsTitle}
            </Text>
            <Text style={[Typography.caption, { color: theme.textSecondary }]}>
              {categoryBudgets.length} ميزانية
            </Text>
          </View>

          {categoryBudgets.length === 0 ? (
            <EmptyState
              icon="pie-chart-outline"
              title={Strings.budgets.noCategoryBudgets}
              subtitle={Strings.budgets.noCategoryBudgetsSubtitle}
              actionTitle={Strings.budgets.addCategoryBudget}
              onAction={openAddModal}
            />
          ) : (
            <View style={styles.categoryBudgetsList}>
              {categoryBudgets.map((item) => {
                const category = item.category_id ? categoryMap.get(item.category_id) : undefined;
                const catName = category?.name || Strings.transactions.uncategorized;
                const status = getBudgetStatus(item.budgeted, item.spent);
                const clampedProgress = Math.min(Math.max(status.ratio, 0), 1);

                return (
                  <TouchableOpacity
                    key={item.budget_id}
                    activeOpacity={0.8}
                    onPress={() => openEditModal(item)}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: status.isOver ? theme.expense : theme.border,
                      },
                      Shadows.subtle,
                    ]}
                  >
                    <View style={styles.catCardTop}>
                      <View style={styles.catTitleRow}>
                        <View style={[styles.catIconWrapper, { backgroundColor: `${status.color}15` }]}>
                          <Ionicons
                            name={(category?.icon as any) || 'pricetag-outline'}
                            size={18}
                            color={status.color}
                          />
                        </View>
                        <View>
                          <Text style={[Typography.bodyMedium, styles.catName, { color: theme.textPrimary }]}>
                            {catName}
                          </Text>
                          <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                            {Strings.budgets.spentOf(
                              formatCurrency(item.spent),
                              formatCurrency(item.budgeted)
                            )}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.catRightCol}>
                        <Text
                          style={[
                            Typography.subhead,
                            styles.catRemainingText,
                            { color: item.remaining >= 0 ? theme.income : theme.expense },
                          ]}
                        >
                          {formatCurrency(item.remaining)}
                        </Text>
                        <Text style={[Typography.caption, { color: theme.textTertiary, fontSize: 11 }]}>
                          {item.remaining >= 0 ? 'متبقي' : 'عجز'}
                        </Text>
                      </View>
                    </View>

                    {/* Progress Bar */}
                    <View style={[styles.catProgressTrack, { backgroundColor: theme.surfaceSubtle }]}>
                      <View
                        style={[
                          styles.catProgressFill,
                          {
                            width: `${clampedProgress * 100}%`,
                            backgroundColor: status.color,
                          },
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* ADD CATEGORY BUDGET MODAL */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalBackdrop, { backgroundColor: theme.modalBackdrop }]}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.elevated,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[Typography.title3, { color: theme.textPrimary, fontWeight: '700' }]}>
                {Strings.budgets.addCategoryBudget}
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: theme.surfaceSubtle }]}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {addError && (
              <View style={{ marginBottom: Spacing.sm }}>
                <ErrorBanner message={addError} onDismiss={() => setAddError(null)} />
              </View>
            )}

            {availableExpenseCategories.length === 0 ? (
              <View style={styles.noCategoriesBox}>
                <Ionicons name="checkmark-circle-outline" size={32} color={theme.income} />
                <Text
                  style={[
                    Typography.bodyMedium,
                    { color: theme.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
                  ]}
                >
                  {Strings.budgets.noAvailableCategories}
                </Text>
              </View>
            ) : (
              <>
                {/* Category Picker */}
                <Text style={[Typography.subhead, styles.inputLabel, { color: theme.textPrimary }]}>
                  {Strings.budgets.selectCategory}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryChipsScroll}
                >
                  {availableExpenseCategories.map((c) => {
                    const isSelected = addCategoryId === c.id;
                    return (
                      <TouchableOpacity
                        key={c.id}
                        activeOpacity={0.75}
                        onPress={() => setAddCategoryId(c.id)}
                        style={[
                          styles.categorySelectChip,
                          {
                            backgroundColor: isSelected ? theme.primaryMuted : theme.surfaceSubtle,
                            borderColor: isSelected ? theme.primary : 'transparent',
                          },
                        ]}
                      >
                        <Ionicons
                          name={(c.icon as any) || 'pricetag-outline'}
                          size={16}
                          color={isSelected ? theme.primary : theme.textSecondary}
                        />
                        <Text
                          style={[
                            Typography.caption,
                            {
                              color: isSelected ? theme.primary : theme.textPrimary,
                              fontWeight: isSelected ? '700' : '500',
                              marginLeft: 4,
                            },
                          ]}
                        >
                          {c.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Amount Input */}
                <Text style={[Typography.subhead, styles.inputLabel, { color: theme.textPrimary }]}>
                  {Strings.budgets.budgetAmountLabel}
                </Text>
                <View
                  style={[
                    styles.amountInputRow,
                    { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                  ]}
                >
                  <TextInput
                    value={addAmountStr}
                    onChangeText={setAddAmountStr}
                    placeholder={Strings.budgets.budgetAmountPlaceholder}
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="decimal-pad"
                    style={[
                      Typography.title2,
                      styles.amountInput,
                      { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                    ]}
                    autoFocus
                  />
                  <Text style={[Typography.subhead, { color: theme.primary, fontWeight: '700' }]}>
                    {Strings.common.currency}
                  </Text>
                </View>

                {/* Action Button */}
                <View style={styles.modalActionRow}>
                  <Button
                    title={Strings.budgets.saveBudget}
                    onPress={handleCreateBudget}
                    loading={addSubmitting}
                    variant="primary"
                  />
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* EDIT BUDGET MODAL */}
      <Modal
        visible={Boolean(editingItem)}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingItem(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalBackdrop, { backgroundColor: theme.modalBackdrop }]}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.elevated,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[Typography.title3, { color: theme.textPrimary, fontWeight: '700' }]}>
                {editingItem?.category_id === null
                  ? Strings.budgets.overallBudget
                  : categoryMap.get(editingItem?.category_id || '')?.name || Strings.budgets.editBudget}
              </Text>
              <TouchableOpacity
                onPress={() => setEditingItem(null)}
                style={[styles.modalCloseBtn, { backgroundColor: theme.surfaceSubtle }]}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {editError && (
              <View style={{ marginBottom: Spacing.sm }}>
                <ErrorBanner message={editError} onDismiss={() => setEditError(null)} />
              </View>
            )}

            <Text style={[Typography.subhead, styles.inputLabel, { color: theme.textPrimary }]}>
              {Strings.budgets.editAmountPrompt}
            </Text>

            <View
              style={[
                styles.amountInputRow,
                { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
              ]}
            >
              <TextInput
                value={editAmountStr}
                onChangeText={setEditAmountStr}
                placeholder={Strings.budgets.budgetAmountPlaceholder}
                placeholderTextColor={theme.textTertiary}
                keyboardType="decimal-pad"
                style={[
                  Typography.title2,
                  styles.amountInput,
                  { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
                autoFocus
              />
              <Text style={[Typography.subhead, { color: theme.primary, fontWeight: '700' }]}>
                {Strings.common.currency}
              </Text>
            </View>

            {/* Note if overall budget */}
            {editingItem?.category_id === null && (
              <Text style={[Typography.caption, { color: theme.textTertiary, marginVertical: Spacing.xs }]}>
                {Strings.budgets.deleteOverallNote}
              </Text>
            )}

            {/* Modal Actions: Save and Delete */}
            <View style={{ marginTop: Spacing.md, gap: Spacing.xs }}>
              <Button
                title={Strings.budgets.saveChanges}
                onPress={handleUpdateBudget}
                loading={editSubmitting}
                variant="primary"
              />

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setDeleteConfirmItem(editingItem);
                }}
                style={styles.deleteBudgetTrigger}
              >
                <Ionicons name="trash-outline" size={16} color={theme.expense} />
                <Text style={[Typography.bodyMedium, { color: theme.expense, fontWeight: '600', marginLeft: 4 }]}>
                  {Strings.budgets.deleteBudget}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={Boolean(deleteConfirmItem)}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmItem(null)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.modalBackdrop }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.elevated,
            ]}
          >
            <View style={[styles.deleteIconWrapper, { backgroundColor: theme.expenseBg }]}>
              <Ionicons name="trash-outline" size={32} color={theme.expense} />
            </View>

            <Text style={[Typography.title3, styles.deleteTitle, { color: theme.textPrimary }]}>
              {Strings.budgets.deleteConfirmTitle}
            </Text>

            <Text style={[Typography.bodyMedium, styles.deleteBody, { color: theme.textSecondary }]}>
              {deleteConfirmItem?.category_id === null
                ? `${Strings.budgets.deleteConfirmBody(Strings.budgets.overallBudget)}\n\n${Strings.budgets.deleteOverallNote}`
                : Strings.budgets.deleteConfirmBody(
                    categoryMap.get(deleteConfirmItem?.category_id || '')?.name || ''
                  )}
            </Text>

            <View style={{ gap: Spacing.xs, marginTop: Spacing.sm }}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={deleting}
                onPress={handleDeleteBudget}
                style={[styles.deleteConfirmBtn, { backgroundColor: theme.expense }]}
              >
                {deleting ? (
                  <ActivityIndicator color={theme.textInverse} size="small" />
                ) : (
                  <Text style={[Typography.headline, { color: theme.textInverse, fontWeight: '700' }]}>
                    {Strings.budgets.confirmDelete}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                disabled={deleting}
                onPress={() => setDeleteConfirmItem(null)}
                style={styles.cancelBtn}
              >
                <Text style={[Typography.bodyMedium, { color: theme.textSecondary }]}>
                  {Strings.budgets.cancel}
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
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 90,
  },
  heroCard: {
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  heroTitleCol: {
    flex: 1,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heroIconBadge: {
    width: 28,
    height: 28,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
    marginBottom: Spacing.sm,
  },
  heroProgressTrack: {
    height: 12,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: Radii.full,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
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
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  categoryBudgetsList: {
    gap: Spacing.xs,
  },
  categoryCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
  },
  catCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  catTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  catIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  catRightCol: {
    alignItems: 'flex-end',
  },
  catRemainingText: {
    fontWeight: '700',
  },
  catProgressTrack: {
    height: 6,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  catProgressFill: {
    height: '100%',
    borderRadius: Radii.full,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCategoriesBox: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  inputLabel: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  categoryChipsScroll: {
    gap: Spacing.xs,
    paddingVertical: 2,
    marginBottom: Spacing.md,
  },
  categorySelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: 1.5,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  amountInput: {
    flex: 1,
    padding: 0,
  },
  modalActionRow: {
    marginTop: Spacing.xs,
  },
  deleteBudgetTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  deleteIconWrapper: {
    width: 60,
    height: 60,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  deleteTitle: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  deleteBody: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  deleteConfirmBtn: {
    height: 48,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    height: 44,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
