import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Button } from '../ui/Button';
import { Wallet, Category } from '../../types/models';
import { useLanguage } from '../../i18n';
import { getLocalizedMonths } from '../../utils/formatters';

export interface FilterState {
  walletId: string | null;
  categoryId: string | null;
  month: number | null; // 1-12
  year: number | null;
}

interface TransactionFilterModalProps {
  visible: boolean;
  wallets: Wallet[];
  categories: Category[];
  draftFilters: FilterState;
  setDraftFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onApply: () => void;
  onClose: () => void;
  onReset: () => void;
}

export function TransactionFilterModal({
  visible,
  wallets,
  categories,
  draftFilters,
  setDraftFilters,
  onApply,
  onClose,
  onReset,
}: TransactionFilterModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { language, isRTL, strings } = useLanguage();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const prevMonthDate = new Date(currentYear, now.getMonth() - 1, 1);
  const prevYear = prevMonthDate.getFullYear();
  const prevMonth = prevMonthDate.getMonth() + 1;

  const isAllTime = draftFilters.month === null && draftFilters.year === null;
  const isThisMonth = draftFilters.month === currentMonth && draftFilters.year === currentYear;
  const isLastMonth = draftFilters.month === prevMonth && draftFilters.year === prevYear;

  const applyAllTimeFilter = () => {
    setDraftFilters((prev) => ({
      ...prev,
      month: null,
      year: null,
    }));
  };

  const applyCurrentMonthFilter = () => {
    setDraftFilters((prev) => ({
      ...prev,
      month: currentMonth,
      year: currentYear,
    }));
  };

  const applyLastMonthFilter = () => {
    setDraftFilters((prev) => ({
      ...prev,
      month: prevMonth,
      year: prevYear,
    }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
          <View
            style={[
              styles.filterSheetHeader,
              {
                borderBottomColor: theme.border,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            <Text style={[Typography.title3, { color: theme.textPrimary, fontWeight: '700' }]}>
              {strings.transactions.filterTitle}
            </Text>
            <TouchableOpacity
              onPress={onClose}
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
              <Text style={[Typography.subhead, styles.sectionTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {strings.transactions.filterWallet}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chipsScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                {/* All Wallets Chip */}
                <TouchableOpacity
                  onPress={() => setDraftFilters((prev) => ({ ...prev, walletId: null }))}
                  style={[
                    styles.filterChip,
                    draftFilters.walletId === null && [
                      styles.filterChipActive,
                      { backgroundColor: theme.primaryMuted, borderColor: theme.primary },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      Typography.caption,
                      {
                        color:
                          draftFilters.walletId === null ? theme.primary : theme.textSecondary,
                        fontWeight: draftFilters.walletId === null ? '700' : '500',
                      },
                    ]}
                  >
                    {strings.transactions.allWallets}
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
                        isSelected && [
                          styles.filterChipActive,
                          { backgroundColor: theme.primaryMuted, borderColor: theme.primary },
                        ],
                      ]}
                    >
                      <Text
                        style={[
                          Typography.caption,
                          {
                            color: isSelected ? theme.primary : theme.textSecondary,
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
              <Text style={[Typography.subhead, styles.sectionTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {strings.transactions.filterCategory}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.chipsScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                {/* All Categories Chip */}
                <TouchableOpacity
                  onPress={() => setDraftFilters((prev) => ({ ...prev, categoryId: null }))}
                  style={[
                    styles.filterChip,
                    draftFilters.categoryId === null && [
                      styles.filterChipActive,
                      { backgroundColor: theme.primaryMuted, borderColor: theme.primary },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      Typography.caption,
                      {
                        color:
                          draftFilters.categoryId === null
                            ? theme.primary
                            : theme.textSecondary,
                        fontWeight: draftFilters.categoryId === null ? '700' : '500',
                      },
                    ]}
                  >
                    {strings.transactions.allCategories}
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
                        isSelected && [
                          styles.filterChipActive,
                          { backgroundColor: theme.primaryMuted, borderColor: theme.primary },
                        ],
                      ]}
                    >
                      <Text
                        style={[
                          Typography.caption,
                          {
                            color: isSelected ? theme.primary : theme.textSecondary,
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
              <Text style={[Typography.subhead, styles.sectionTitle, { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                {strings.transactions.filterTime}
              </Text>

              {/* Quick Presets (All Time / This Month / Last Month) */}
              <View style={[styles.timePresetsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  onPress={applyAllTimeFilter}
                  style={[
                    styles.presetBtn,
                    isAllTime && [
                      styles.presetBtnActive,
                      { backgroundColor: theme.primaryMuted, borderColor: theme.primary },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      Typography.caption,
                      {
                        color: isAllTime ? theme.primary : theme.textSecondary,
                        fontWeight: isAllTime ? '700' : '500',
                      },
                    ]}
                  >
                    {strings.transactions.allTime}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={applyCurrentMonthFilter}
                  style={[
                    styles.presetBtn,
                    isThisMonth && [
                      styles.presetBtnActive,
                      { backgroundColor: theme.primaryMuted, borderColor: theme.primary },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      Typography.caption,
                      {
                        color: isThisMonth ? theme.primary : theme.textSecondary,
                        fontWeight: isThisMonth ? '700' : '500',
                      },
                    ]}
                  >
                    {strings.transactions.thisMonth}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={applyLastMonthFilter}
                  style={[
                    styles.presetBtn,
                    isLastMonth && [
                      styles.presetBtnActive,
                      { backgroundColor: theme.primaryMuted, borderColor: theme.primary },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      Typography.caption,
                      {
                        color: isLastMonth ? theme.primary : theme.textSecondary,
                        fontWeight: isLastMonth ? '700' : '500',
                      },
                    ]}
                  >
                    {strings.transactions.lastMonth}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Month Selector Carousel in Filter */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.monthsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                {getLocalizedMonths(language).map((mName: string, idx: number) => {
                  const mNum = idx + 1;
                  const isSelected =
                    draftFilters.month === mNum &&
                    draftFilters.year === (draftFilters.year || new Date().getFullYear());

                  return (
                    <TouchableOpacity
                      key={mNum}
                      onPress={() => {
                        setDraftFilters((prev) => ({
                          ...prev,
                          month: mNum,
                          year: prev.year || new Date().getFullYear(),
                        }));
                      }}
                      style={[
                        styles.monthChip,
                        isSelected && [
                          styles.monthChipActive,
                          { backgroundColor: theme.primary, borderColor: theme.primary },
                        ],
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
              </ScrollView>
            </View>
          </ScrollView>

          {/* Sheet Actions */}
          <View
            style={[
              styles.filterSheetFooter,
              {
                borderTopColor: theme.border,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Button
                title={strings.transactions.applyFilters}
                onPress={onApply}
                variant="primary"
              />
            </View>
            <View style={{ width: Spacing.sm }} />
            <View style={{ flex: 0.6 }}>
              <Button
                title={strings.transactions.resetFilters}
                onPress={onReset}
                variant="ghost"
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  filterBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  filterSheet: {
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    borderTopWidth: 1,
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
    paddingBottom: Spacing.xl,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterSectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  chipsScroll: {
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  filterChipActive: {},
  periodShortcutsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  timePresetsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  periodShortcutBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  presetBtnActive: {},
  monthsGrid: {
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  monthChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.md,
    marginRight: Spacing.xs,
  },
  monthChipActive: {},
  filterSheetFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});
