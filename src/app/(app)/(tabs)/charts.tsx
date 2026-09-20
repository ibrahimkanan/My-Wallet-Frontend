import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  I18nManager,
  Dimensions,
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
import { MonthYearSelector, ErrorBanner } from '../../../components/ui';
import { EmptyState } from '../../../components/home';
import api from '../../../services/api';
import { getErrorMessage } from '../../../utils/errors';
import {
  MonthlyChartSummary,
  YearlyChartSummary,
  Category,
} from '../../../types/models';
import {
  GetMonthlyChartResponse,
  GetYearlyChartResponse,
  GetCategoriesResponse,
} from '../../../types/api';
import { formatCurrency, ARABIC_MONTHS } from '../../../utils/formatters';

type ViewMode = 'monthly' | 'yearly';

const CATEGORY_PALETTE = [
  BrandColors.pine500, // #109381
  BrandColors.gold500, // #D4AF37
  '#3B82F6', // Royal Blue
  BrandColors.rose500, // #E11D48
  '#8B5CF6', // Purple
  BrandColors.amber500, // #F59E0B
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#10B981', // Emerald
];

export default function ChartsScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  // Mode & Period State
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data States
  const [monthlyData, setMonthlyData] = useState<MonthlyChartSummary | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyChartSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inspected Month in Yearly View
  const [inspectedMonth, setInspectedMonth] = useState<number | null>(
    new Date().getMonth() + 1
  );

  // Category map for icons
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Fetch Monthly or Yearly Data
  const fetchChartData = useCallback(
    async (isRefresh = false) => {
      try {
        if (!isRefresh) setLoading(true);
        setError(null);

        const categoriesPromise =
          categories.length === 0
            ? api.get<GetCategoriesResponse>('/categories')
            : Promise.resolve(null);

        if (viewMode === 'monthly') {
          const [chartRes, catRes] = await Promise.all([
            api.get<GetMonthlyChartResponse>(
              `/charts/monthly?month=${selectedMonth}&year=${selectedYear}`
            ),
            categoriesPromise,
          ]);

          if (chartRes.data?.summary) {
            setMonthlyData(chartRes.data.summary);
          }
          if (catRes && catRes.data?.categories) {
            setCategories(catRes.data.categories);
          }
        } else {
          const [chartRes, catRes] = await Promise.all([
            api.get<GetYearlyChartResponse>(`/charts/yearly?year=${selectedYear}`),
            categoriesPromise,
          ]);

          if (chartRes.data?.summary) {
            setYearlyData(chartRes.data.summary);
          }
          if (catRes && catRes.data?.categories) {
            setCategories(catRes.data.categories);
          }
        }
      } catch (err) {
        console.warn('[Charts] Error fetching chart data:', err);
        setError(getErrorMessage(err, Strings.common.errorOccurred));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [viewMode, selectedMonth, selectedYear, categories.length]
  );

  // Sync on focus
  useFocusEffect(
    useCallback(() => {
      fetchChartData();
    }, [fetchChartData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChartData(true);
  };

  // Yearly view calculation for scaling bars
  const maxMonthlyVal = useMemo(() => {
    if (!yearlyData?.by_month || yearlyData.by_month.length === 0) return 100;
    let max = 0;
    for (const m of yearlyData.by_month) {
      if (m.total_income > max) max = m.total_income;
      if (m.total_expense > max) max = m.total_expense;
    }
    return max > 0 ? max : 100;
  }, [yearlyData]);

  // Selected inspected month data in yearly view
  const selectedInspectedData = useMemo(() => {
    if (!yearlyData || inspectedMonth === null) return null;
    return yearlyData.by_month.find((m) => m.month === inspectedMonth) || null;
  }, [yearlyData, inspectedMonth]);

  // Check empty state
  const isMonthlyEmpty =
    !monthlyData ||
    (monthlyData.total_income === 0 &&
      monthlyData.total_expense === 0 &&
      monthlyData.by_category.length === 0);

  const isYearlyEmpty =
    !yearlyData ||
    (yearlyData.total_income === 0 && yearlyData.total_expense === 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Screen Header */}
      <View style={[styles.headerBar, { borderBottomColor: theme.border }]}>
        <Text
          style={[
            Typography.title1,
            styles.screenTitle,
            { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        >
          {Strings.charts.title}
        </Text>

        {/* View Mode Toggle: Monthly vs Yearly */}
        <View style={[styles.viewToggleWrapper, { backgroundColor: theme.surfaceSubtle }]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setViewMode('monthly')}
            style={[
              styles.toggleBtn,
              viewMode === 'monthly' && [
                styles.toggleBtnActive,
                { backgroundColor: theme.surface },
                Shadows.subtle,
              ],
            ]}
          >
            <Text
              style={[
                Typography.caption,
                {
                  color: viewMode === 'monthly' ? theme.primary : theme.textSecondary,
                  fontWeight: viewMode === 'monthly' ? '700' : '500',
                },
              ]}
            >
              {Strings.charts.viewMonthly}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setViewMode('yearly')}
            style={[
              styles.toggleBtn,
              viewMode === 'yearly' && [
                styles.toggleBtnActive,
                { backgroundColor: theme.surface },
                Shadows.subtle,
              ],
            ]}
          >
            <Text
              style={[
                Typography.caption,
                {
                  color: viewMode === 'yearly' ? theme.primary : theme.textSecondary,
                  fontWeight: viewMode === 'yearly' ? '700' : '500',
                },
              ]}
            >
              {Strings.charts.viewYearly}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Shared Period Navigation */}
      <MonthYearSelector
        month={selectedMonth}
        year={selectedYear}
        mode={viewMode === 'monthly' ? 'month' : 'year'}
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
          {/* Error Banner with Retry Action */}
          {error && (
            <View style={styles.errorContainer}>
              <ErrorBanner message={error} onDismiss={() => setError(null)} />
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setLoading(true);
                  fetchChartData();
                }}
                style={[styles.retryBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Ionicons name="refresh-outline" size={16} color={theme.primary} />
                <Text style={[Typography.caption, { color: theme.primary, fontWeight: '700', marginHorizontal: 6 }]}>
                  {Strings.common.retry}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================================================= */}
          {/* MONTHLY VIEW */}
          {/* ========================================================================= */}
          {viewMode === 'monthly' && (
            <>
              {/* 3 Headline Cards (Income, Expense, Net) */}
              <View style={styles.headlineCardsRow}>
                {/* Total Income */}
                <View
                  style={[
                    styles.headlineCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    Shadows.card,
                  ]}
                >
                  <View style={styles.headlineTop}>
                    <View style={[styles.headlineDot, { backgroundColor: theme.income }]} />
                    <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                      {Strings.charts.totalIncome}
                    </Text>
                  </View>
                  <Text
                    style={[Typography.title3, styles.headlineValue, { color: theme.income }]}
                    numberOfLines={1}
                  >
                    +{formatCurrency(monthlyData?.total_income || 0)}
                  </Text>
                </View>

                {/* Total Expense */}
                <View
                  style={[
                    styles.headlineCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    Shadows.card,
                  ]}
                >
                  <View style={styles.headlineTop}>
                    <View style={[styles.headlineDot, { backgroundColor: theme.expense }]} />
                    <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                      {Strings.charts.totalExpense}
                    </Text>
                  </View>
                  <Text
                    style={[Typography.title3, styles.headlineValue, { color: theme.expense }]}
                    numberOfLines={1}
                  >
                    -{formatCurrency(monthlyData?.total_expense || 0)}
                  </Text>
                </View>
              </View>

              {/* Net Savings Banner Card */}
              <View
                style={[
                  styles.netCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  Shadows.card,
                ]}
              >
                <View style={styles.netCardInner}>
                  <View>
                    <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                      {Strings.charts.netSavings}
                    </Text>
                    <Text
                      style={[
                        Typography.title2,
                        styles.netValue,
                        {
                          color:
                            (monthlyData?.net || 0) >= 0
                              ? theme.income
                              : theme.expense,
                        },
                      ]}
                    >
                      {formatCurrency(monthlyData?.net || 0)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.netBadge,
                      {
                        backgroundColor:
                          (monthlyData?.net || 0) >= 0
                            ? theme.incomeBg
                            : theme.expenseBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        (monthlyData?.net || 0) >= 0
                          ? 'trending-up'
                          : 'trending-down'
                      }
                      size={18}
                      color={
                        (monthlyData?.net || 0) >= 0
                          ? theme.income
                          : theme.expense
                      }
                    />
                  </View>
                </View>
              </View>

              {/* Category Breakdown Section */}
              <View style={styles.sectionHeader}>
                <Text style={[Typography.headline, styles.sectionTitle, { color: theme.textPrimary }]}>
                  {Strings.charts.categoryBreakdown}
                </Text>
                <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                  {Strings.charts.categoryBreakdownSubtitle}
                </Text>
              </View>

              {isMonthlyEmpty ? (
                <EmptyState
                  icon="pie-chart-outline"
                  title={Strings.charts.emptyMonth}
                  subtitle={Strings.charts.emptyMonthSubtitle}
                />
              ) : (
                <View
                  style={[
                    styles.breakdownCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    Shadows.card,
                  ]}
                >
                  {/* Multi-Segment Proportional Composition Bar */}
                  <View style={styles.compositionBar}>
                    {monthlyData?.by_category.map((cat, index) => {
                      const totalExp = monthlyData.total_expense || 1;
                      const slicePercent = Math.max(
                        Math.round((cat.total / totalExp) * 100),
                        2
                      );
                      const color = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];

                      return (
                        <View
                          key={cat.category_id || `slice-${index}`}
                          style={[
                            styles.barSlice,
                            {
                              flex: cat.total,
                              backgroundColor: color,
                            },
                          ]}
                        />
                      );
                    })}
                  </View>

                  {/* Category Items Breakdown */}
                  <View style={styles.categoryItemsList}>
                    {monthlyData?.by_category.map((cat, index) => {
                      const totalExp = monthlyData.total_expense || 1;
                      const percent = Math.round((cat.total / totalExp) * 100);
                      const ratio = cat.total / totalExp;
                      const color = CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
                      const matchedCat = cat.category_id
                        ? categoryMap.get(cat.category_id)
                        : undefined;
                      const catName =
                        cat.category_name ||
                        matchedCat?.name ||
                        Strings.charts.uncategorized;

                      return (
                        <View key={cat.category_id || `cat-${index}`} style={styles.categoryRow}>
                          <View style={styles.catRowTop}>
                            <View style={styles.catNameRow}>
                              <View style={[styles.colorIndicatorDot, { backgroundColor: color }]} />
                              <Ionicons
                                name={(matchedCat?.icon as any) || 'pricetag-outline'}
                                size={15}
                                color={theme.textSecondary}
                                style={{ marginHorizontal: 4 }}
                              />
                              <Text
                                style={[Typography.bodyMedium, styles.catNameText, { color: theme.textPrimary }]}
                                numberOfLines={1}
                              >
                                {catName}
                              </Text>
                            </View>

                            <View style={styles.catAmountsCol}>
                              <Text style={[Typography.subhead, styles.catAmountText, { color: theme.textPrimary }]}>
                                {formatCurrency(cat.total)}
                              </Text>
                              <Text style={[Typography.caption, { color: theme.textTertiary, fontSize: 11 }]}>
                                {percent}%
                              </Text>
                            </View>
                          </View>

                          {/* Individual Progress Track */}
                          <View style={[styles.individualTrack, { backgroundColor: theme.surfaceSubtle }]}>
                            <View
                              style={[
                                styles.individualFill,
                                {
                                  width: `${Math.min(ratio * 100, 100)}%`,
                                  backgroundColor: color,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}

          {/* ========================================================================= */}
          {/* YEARLY VIEW */}
          {/* ========================================================================= */}
          {viewMode === 'yearly' && (
            <>
              {/* 3 Headline Cards (Annual Totals) */}
              <View style={styles.headlineCardsRow}>
                {/* Annual Income */}
                <View
                  style={[
                    styles.headlineCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    Shadows.card,
                  ]}
                >
                  <View style={styles.headlineTop}>
                    <View style={[styles.headlineDot, { backgroundColor: theme.income }]} />
                    <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                      {Strings.charts.totalIncome}
                    </Text>
                  </View>
                  <Text
                    style={[Typography.title3, styles.headlineValue, { color: theme.income }]}
                    numberOfLines={1}
                  >
                    +{formatCurrency(yearlyData?.total_income || 0)}
                  </Text>
                </View>

                {/* Annual Expense */}
                <View
                  style={[
                    styles.headlineCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    Shadows.card,
                  ]}
                >
                  <View style={styles.headlineTop}>
                    <View style={[styles.headlineDot, { backgroundColor: theme.expense }]} />
                    <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                      {Strings.charts.totalExpense}
                    </Text>
                  </View>
                  <Text
                    style={[Typography.title3, styles.headlineValue, { color: theme.expense }]}
                    numberOfLines={1}
                  >
                    -{formatCurrency(yearlyData?.total_expense || 0)}
                  </Text>
                </View>
              </View>

              {/* Annual Net Card */}
              <View
                style={[
                  styles.netCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                  Shadows.card,
                ]}
              >
                <View style={styles.netCardInner}>
                  <View>
                    <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                      {Strings.charts.netSavings} ({selectedYear})
                    </Text>
                    <Text
                      style={[
                        Typography.title2,
                        styles.netValue,
                        {
                          color:
                            (yearlyData?.net || 0) >= 0
                              ? theme.income
                              : theme.expense,
                        },
                      ]}
                    >
                      {formatCurrency(yearlyData?.net || 0)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.netBadge,
                      {
                        backgroundColor:
                          (yearlyData?.net || 0) >= 0
                            ? theme.incomeBg
                            : theme.expenseBg,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        (yearlyData?.net || 0) >= 0
                          ? 'trending-up'
                          : 'trending-down'
                      }
                      size={18}
                      color={
                        (yearlyData?.net || 0) >= 0
                          ? theme.income
                          : theme.expense
                      }
                    />
                  </View>
                </View>
              </View>

              {/* 12-Month Comparison Bar Chart Section */}
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={[Typography.headline, styles.sectionTitle, { color: theme.textPrimary }]}>
                    {Strings.charts.yearlyTrend}
                  </Text>
                  <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                    {Strings.charts.yearlyTrendSubtitle}
                  </Text>
                </View>

                {/* Legend */}
                <View style={styles.chartLegendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.income }]} />
                    <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                      {Strings.charts.incomeLegend}
                    </Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: theme.expense }]} />
                    <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                      {Strings.charts.expenseLegend}
                    </Text>
                  </View>
                </View>
              </View>

              {isYearlyEmpty ? (
                <EmptyState
                  icon="bar-chart-outline"
                  title={Strings.charts.emptyYear}
                  subtitle={Strings.charts.emptyYearSubtitle}
                />
              ) : (
                <View
                  style={[
                    styles.yearlyChartCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    Shadows.card,
                  ]}
                >
                  {/* Selected Month Inspector Tooltip Card */}
                  {selectedInspectedData && (
                    <View
                      style={[
                        styles.inspectorCard,
                        { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                      ]}
                    >
                      <Text style={[Typography.caption, styles.inspectorTitle, { color: theme.textPrimary }]}>
                        {Strings.charts.monthDetails(ARABIC_MONTHS[selectedInspectedData.month - 1])}
                      </Text>

                      <View style={styles.inspectorRow}>
                        <Text style={[Typography.caption, { color: theme.income, fontWeight: '700' }]}>
                          دخل: +{formatCurrency(selectedInspectedData.total_income)}
                        </Text>
                        <Text style={[Typography.caption, { color: theme.textTertiary }]}> • </Text>
                        <Text style={[Typography.caption, { color: theme.expense, fontWeight: '700' }]}>
                          صرف: -{formatCurrency(selectedInspectedData.total_expense)}
                        </Text>
                        <Text style={[Typography.caption, { color: theme.textTertiary }]}> • </Text>
                        <Text
                          style={[
                            Typography.caption,
                            {
                              color:
                                selectedInspectedData.net >= 0
                                  ? theme.income
                                  : theme.expense,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          صافي: {formatCurrency(selectedInspectedData.net)}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Horizontal Scrollable 12-Month Bar Chart */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chartBarsScroll}
                  >
                    {yearlyData?.by_month.map((item) => {
                      const isInspected = inspectedMonth === item.month;
                      const incomeRatio = item.total_income / maxMonthlyVal;
                      const expenseRatio = item.total_expense / maxMonthlyVal;

                      const CHART_MAX_HEIGHT = 140;
                      const incomeBarHeight = Math.max(incomeRatio * CHART_MAX_HEIGHT, 4);
                      const expenseBarHeight = Math.max(expenseRatio * CHART_MAX_HEIGHT, 4);

                      const monthLabel = ARABIC_MONTHS[item.month - 1];

                      return (
                        <TouchableOpacity
                          key={item.month}
                          activeOpacity={0.8}
                          onPress={() => setInspectedMonth(item.month)}
                          style={[
                            styles.monthColWrapper,
                            isInspected && {
                              backgroundColor: theme.surfaceSubtle,
                              borderRadius: Radii.lg,
                            },
                          ]}
                        >
                          {/* Bars Column (Bottom-Aligned) */}
                          <View style={[styles.dualBarsBox, { height: CHART_MAX_HEIGHT }]}>
                            {/* Income Bar */}
                            <View
                              style={[
                                styles.verticalBar,
                                {
                                  height: item.total_income > 0 ? incomeBarHeight : 4,
                                  backgroundColor:
                                    item.total_income > 0 ? theme.income : theme.borderSubtle,
                                },
                              ]}
                            />

                            {/* Expense Bar */}
                            <View
                              style={[
                                styles.verticalBar,
                                {
                                  height: item.total_expense > 0 ? expenseBarHeight : 4,
                                  backgroundColor:
                                    item.total_expense > 0 ? theme.expense : theme.borderSubtle,
                                },
                              ]}
                            />
                          </View>

                          {/* Month Label */}
                          <Text
                            style={[
                              Typography.caption,
                              styles.monthBarLabel,
                              {
                                color: isInspected ? theme.primary : theme.textSecondary,
                                fontWeight: isInspected ? '700' : '500',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {monthLabel}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
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
  viewToggleWrapper: {
    flexDirection: 'row',
    borderRadius: Radii.full,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  toggleBtnActive: {
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
  headlineCardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  headlineCard: {
    flex: 1,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  headlineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  headlineDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
    marginRight: 6,
  },
  headlineValue: {
    fontWeight: '800',
  },
  netCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  netCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  netValue: {
    fontWeight: '800',
    marginTop: 2,
  },
  netBadge: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  chartLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: Radii.full,
  },
  breakdownCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  compositionBar: {
    flexDirection: 'row',
    height: 12,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  barSlice: {
    height: '100%',
  },
  categoryItemsList: {
    gap: Spacing.md,
  },
  categoryRow: {
    gap: 6,
  },
  catRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: Radii.full,
    marginRight: 6,
  },
  catNameText: {
    fontWeight: '600',
  },
  catAmountsCol: {
    alignItems: 'flex-end',
  },
  catAmountText: {
    fontWeight: '700',
  },
  individualTrack: {
    height: 6,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  individualFill: {
    height: '100%',
    borderRadius: Radii.full,
  },
  yearlyChartCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  inspectorCard: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  inspectorTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  inspectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chartBarsScroll: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  monthColWrapper: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  dualBarsBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: Spacing.xs,
  },
  verticalBar: {
    width: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  monthBarLabel: {
    fontSize: 11,
  },
  errorContainer: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
