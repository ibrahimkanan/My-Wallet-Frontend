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
import { Strings } from '../../constants/strings';
import { Button } from '../ui/Button';
import { Wallet, Category } from '../../types/models';
import { ARABIC_MONTHS } from '../../utils/formatters';

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

  const applyCurrentMonthFilter = () => {
    const now = new Date();
    setDraftFilters((prev) => ({
      ...prev,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    }));
  };

  const applyLastMonthFilter = () => {
    const prevMonthDate = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
    setDraftFilters((prev) => ({
      ...prev,
      month: prevMonthDate.getMonth() + 1,
      year: prevMonthDate.getFullYear(),
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
          <View style={[styles.filterSheetHeader, { borderBottomColor: theme.border }]}>
            <Text style={[Typography.title3, { color: theme.textPrimary, fontWeight: '700' }]}>
              {Strings.transactions.filterTitle}
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
              <Text style={[Typography.subhead, styles.filterSectionTitle, { color: theme.textPrimary }]}>
                {Strings.transactions.filterWallet}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
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

              {/* Month Selector Carousel in Filter */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthsGrid}
              >
                {ARABIC_MONTHS.map((mName, idx) => {
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
              </ScrollView>
            </View>
          </ScrollView>

          {/* Sheet Actions */}
          <View style={[styles.filterSheetFooter, { borderTopColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Button
                title={Strings.transactions.applyFilters}
                onPress={onApply}
                variant="primary"
              />
            </View>
            <View style={{ width: Spacing.sm }} />
            <View style={{ flex: 0.6 }}>
              <Button
                title={Strings.transactions.resetFilters}
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
  periodShortcutsRow: {
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
  filterSheetFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
});
