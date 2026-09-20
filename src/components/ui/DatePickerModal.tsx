import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { getLocalizedMonths, formatDateToISO } from '../../utils/formatters';
import { Strings } from '../../constants/strings';
import { useLanguage } from '../../i18n';
import { Button } from './Button';

interface DatePickerModalProps {
  visible: boolean;
  initialDate?: string; // YYYY-MM-DD
  onSelect: (dateStr: string) => void;
  onClose: () => void;
}

const WEEKDAYS_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'];
const WEEKDAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function DatePickerModal({
  visible,
  initialDate,
  onSelect,
  onClose,
}: DatePickerModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { isRTL, language } = useLanguage();

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

  const months = getLocalizedMonths(language);
  const monthName = months[viewMonth] || '';
  const weekdays = isRTL ? WEEKDAYS_AR : WEEKDAYS_EN;

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
              onPress={isRTL ? handleNextMonth : handlePrevMonth}
              style={[styles.navButton, { backgroundColor: theme.surfaceSubtle }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="chevron-back"
                size={18}
                color={theme.textPrimary}
              />
            </TouchableOpacity>

            <Text style={[Typography.subhead, styles.monthTitle, { color: theme.textPrimary }]}>
              {monthName} {viewYear}
            </Text>

            <TouchableOpacity
              onPress={isRTL ? handlePrevMonth : handleNextMonth}
              style={[styles.navButton, { backgroundColor: theme.surfaceSubtle }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekdaysRow}>
            {weekdays.map((wd, index) => (
              <View key={index} style={styles.cell}>
                <Text style={[Typography.caption, styles.weekdayText, { color: theme.textTertiary }]}>
                  {wd}
                </Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {/* Empty slots before the first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, index) => (
              <View key={`empty-${index}`} style={styles.cell} />
            ))}

            {/* Actual day cells */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateStr;
              const isToday = formatDateToISO(new Date()) === dateStr;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  activeOpacity={0.7}
                  onPress={() => handleSelectDay(day)}
                  style={[
                    styles.cell,
                    styles.dayCell,
                    isSelected && { backgroundColor: theme.primary },
                    !isSelected && isToday && { borderColor: theme.primary, borderWidth: 1 },
                  ]}
                >
                  <Text
                    style={[
                      Typography.caption,
                      styles.dayText,
                      {
                        color: isSelected
                          ? theme.textInverse
                          : isToday
                          ? theme.primary
                          : theme.textPrimary,
                        fontWeight: isSelected || isToday ? '700' : '500',
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
                title={Strings.common.confirmSelection}
                onPress={handleConfirm}
                variant="primary"
              />
            </View>
            <View style={{ width: Spacing.sm }} />
            <View style={{ flex: 0.6 }}>
              <Button
                title={Strings.common.cancel}
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
  navButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
  },
  weekdayText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.lg,
  },
  dayCell: {
    borderRadius: Radii.full,
  },
  dayText: {
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
