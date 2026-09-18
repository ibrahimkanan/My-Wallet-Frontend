import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useColorScheme,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { ARABIC_MONTHS, formatDateToISO } from '../../utils/formatters';
import { Button } from './Button';

interface DatePickerModalProps {
  visible: boolean;
  initialDate?: string; // YYYY-MM-DD
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

const WEEKDAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];

export function DatePickerModal({
  visible,
  initialDate,
  onSelect,
  onClose,
}: DatePickerModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  // Parse initial date
  const parsedInitial = useMemo(() => {
    if (!initialDate) return new Date();
    const parts = initialDate.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date();
  }, [initialDate]);

  const [viewYear, setViewYear] = useState<number>(parsedInitial.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(parsedInitial.getMonth()); // 0-11
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || formatDateToISO(new Date())
  );

  // Sync state when modal opens
  React.useEffect(() => {
    if (visible) {
      const parts = (initialDate || formatDateToISO(new Date())).split('-');
      if (parts.length === 3) {
        setViewYear(parseInt(parts[0], 10));
        setViewMonth(parseInt(parts[1], 10) - 1);
        setSelectedDate(initialDate || formatDateToISO(new Date()));
      }
    }
  }, [visible, initialDate]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Days calculations
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    // 0 = Sunday, 1 = Monday, etc.
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  const monthName = ARABIC_MONTHS[viewMonth] || '';

  const handleSelectDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    setSelectedDate(formatDateToISO(d));
  };

  const handleConfirm = () => {
    onSelect(selectedDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.modalBackdrop }]}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.elevated,
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={handleNextMonth}
              style={[styles.navButton, { backgroundColor: theme.surfaceSubtle }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'}
                size={18}
                color={theme.textPrimary}
              />
            </TouchableOpacity>

            <Text style={[Typography.subhead, styles.monthTitle, { color: theme.textPrimary }]}>
              {monthName} {viewYear}
            </Text>

            <TouchableOpacity
              onPress={handlePrevMonth}
              style={[styles.navButton, { backgroundColor: theme.surfaceSubtle }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                size={18}
                color={theme.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((wd, index) => (
              <View key={index} style={styles.cell}>
                <Text style={[Typography.caption, styles.weekdayText, { color: theme.textTertiary }]}>
                  {wd}
                </Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.cell} />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  activeOpacity={0.7}
                  onPress={() => handleSelectDay(day)}
                  style={[
                    styles.cell,
                    styles.dayCell,
                    isSelected && {
                      backgroundColor: theme.primary,
                      borderRadius: Radii.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      Typography.bodyMedium,
                      styles.dayText,
                      {
                        color: isSelected ? theme.textInverse : theme.textPrimary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Modal Actions */}
          <View style={styles.actionsRow}>
            <View style={{ flex: 1 }}>
              <Button
                title="تأكيد الاختيار"
                onPress={handleConfirm}
                variant="primary"
              />
            </View>
            <View style={{ width: Spacing.sm }} />
            <View style={{ flex: 0.6 }}>
              <Button
                title="إلغاء"
                onPress={onClose}
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
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  monthTitle: {
    fontWeight: '700',
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: Spacing.xs,
  },
  weekdayText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  cell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCell: {
    marginVertical: 2,
  },
  dayText: {
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
});
