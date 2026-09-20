import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { getLocalizedMonths } from '../../utils/formatters';
import { Strings } from '../../constants/strings';
import { useLanguage } from '../../i18n';
import { Button } from './Button';

interface MonthYearSelectorProps {
  month?: number; // 1-12
  year: number;
  mode?: 'month' | 'year';
  onChangeMonth?: (month: number) => void;
  onChangeYear: (year: number) => void;
}

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028];

export function MonthYearSelector({
  month = new Date().getMonth() + 1,
  year,
  mode = 'month',
  onChangeMonth,
  onChangeYear,
}: MonthYearSelectorProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { isRTL, language } = useLanguage();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalYear, setModalYear] = useState(year);

  // Month navigation
  const handlePrev = () => {
    if (mode === 'year') {
      onChangeYear(year - 1);
      return;
    }

    if (month === 1) {
      if (onChangeMonth) onChangeMonth(12);
      onChangeYear(year - 1);
    } else {
      if (onChangeMonth) onChangeMonth(month - 1);
    }
  };

  const handleNext = () => {
    if (mode === 'year') {
      onChangeYear(year + 1);
      return;
    }

    if (month === 12) {
      if (onChangeMonth) onChangeMonth(1);
      onChangeYear(year + 1);
    } else {
      if (onChangeMonth) onChangeMonth(month + 1);
    }
  };

  const openPicker = () => {
    setModalYear(year);
    setModalVisible(true);
  };

  const months = getLocalizedMonths(language);
  const monthName = months[month - 1] || '';
  const displayLabel = mode === 'month' ? `${monthName} ${year}` : `${year}`;

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
          Shadows.subtle,
        ]}
      >
        {/* Left Arrow Button (Prev in LTR, Next in RTL) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={isRTL ? handleNext : handlePrev}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.arrowButton, { backgroundColor: theme.surfaceSubtle }]}
        >
          <Ionicons
            name="chevron-back"
            size={18}
            color={theme.textPrimary}
          />
        </TouchableOpacity>

        {/* Center Label (Tappable to jump) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openPicker}
          style={styles.labelButton}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={theme.primary}
            style={{ marginRight: 6 }}
          />
          <Text style={[Typography.subhead, styles.labelText, { color: theme.textPrimary }]}>
            {displayLabel}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={theme.textTertiary}
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        {/* Right Arrow Button (Next in LTR, Prev in RTL) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={isRTL ? handlePrev : handleNext}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.arrowButton, { backgroundColor: theme.surfaceSubtle }]}
        >
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Jump Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.modalBackdrop }]}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.elevated,
            ]}
          >
            {/* Year Selector within modal */}
            <View style={styles.modalYearRow}>
              <TouchableOpacity
                onPress={() => setModalYear((prev) => prev + (isRTL ? 1 : -1))}
                style={[styles.yearNavBtn, { backgroundColor: theme.surfaceSubtle }]}
              >
                <Ionicons
                  name="chevron-back"
                  size={18}
                  color={theme.textPrimary}
                />
              </TouchableOpacity>

              <Text style={[Typography.title3, { color: theme.textPrimary, fontWeight: '700' }]}>
                {modalYear}
              </Text>

              <TouchableOpacity
                onPress={() => setModalYear((prev) => prev + (isRTL ? -1 : 1))}
                style={[styles.yearNavBtn, { backgroundColor: theme.surfaceSubtle }]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={theme.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {/* Quick Year Chips */}
            <View style={styles.quickYearsRow}>
              {AVAILABLE_YEARS.map((y) => {
                const isSelected = modalYear === y;
                return (
                  <TouchableOpacity
                    key={y}
                    onPress={() => {
                      setModalYear(y);
                      if (mode === 'year') {
                        onChangeYear(y);
                        setModalVisible(false);
                      }
                    }}
                    style={[
                      styles.yearChip,
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
                      {y}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Months Grid (Only in Month mode) */}
            {mode === 'month' && (
              <View style={styles.monthsGrid}>
                {months.map((mName, index) => {
                  const mNum = index + 1;
                  const isCurrent = month === mNum && year === modalYear;
                  return (
                    <TouchableOpacity
                      key={mName}
                      activeOpacity={0.7}
                      onPress={() => {
                        onChangeYear(modalYear);
                        if (onChangeMonth) onChangeMonth(mNum);
                        setModalVisible(false);
                      }}
                      style={[
                        styles.monthCell,
                        {
                          backgroundColor: isCurrent ? theme.primary : theme.surfaceSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          Typography.caption,
                          styles.monthCellText,
                          {
                            color: isCurrent ? theme.textInverse : theme.textPrimary,
                            fontWeight: isCurrent ? '700' : '500',
                          },
                        ]}
                      >
                        {mName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                title={mode === 'year' ? Strings.common.confirm : Strings.common.close}
                onPress={() => {
                  if (mode === 'year') onChangeYear(modalYear);
                  setModalVisible(false);
                }}
                variant="secondary"
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radii.xl,
    borderWidth: 1,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
  },
  labelText: {
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  modalYearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  yearNavBtn: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickYearsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  yearChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  monthCell: {
    width: '31%',
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  monthCellText: {
    textAlign: 'center',
  },
  modalActions: {
    marginTop: Spacing.xs,
  },
});
