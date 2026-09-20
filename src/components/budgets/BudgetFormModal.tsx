import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { Category, BudgetSummaryItem } from '../../types/models';

interface BudgetFormModalProps {
  visible: boolean;
  mode: 'add' | 'edit';
  editingItem?: BudgetSummaryItem | null;
  categoryName?: string;
  availableCategories?: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  amountStr: string;
  onChangeAmount: (text: string) => void;
  error: string | null;
  onDismissError: () => void;
  submitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
  onDelete?: () => void;
}

export function BudgetFormModal({
  visible,
  mode,
  editingItem,
  categoryName,
  availableCategories = [],
  selectedCategoryId,
  onSelectCategory,
  amountStr,
  onChangeAmount,
  error,
  onDismissError,
  submitting,
  onSubmit,
  onClose,
  onDelete,
}: BudgetFormModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const isEdit = mode === 'edit';
  const modalTitle = isEdit
    ? editingItem?.category_id === null
      ? Strings.budgets.overallBudget
      : categoryName || Strings.budgets.editBudget
    : Strings.budgets.addCategoryBudget;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[Typography.title3, { color: theme.textPrimary, fontWeight: '700' }]}>
              {modalTitle}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.modalCloseBtn, { backgroundColor: theme.surfaceSubtle }]}
            >
              <Ionicons name="close" size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {error && (
            <View style={{ marginBottom: Spacing.sm }}>
              <ErrorBanner message={error} onDismiss={onDismissError} />
            </View>
          )}

          {!isEdit && availableCategories.length === 0 ? (
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
              {/* Category Picker (Add Mode Only) */}
              {!isEdit && (
                <>
                  <Text style={[Typography.subhead, styles.inputLabel, { color: theme.textPrimary }]}>
                    {Strings.budgets.selectCategory}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryChipsScroll}
                  >
                    {availableCategories.map((c) => {
                      const isSelected = selectedCategoryId === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          activeOpacity={0.75}
                          onPress={() => onSelectCategory(c.id)}
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
                </>
              )}

              {/* Amount Input */}
              <Text style={[Typography.subhead, styles.inputLabel, { color: theme.textPrimary }]}>
                {isEdit ? Strings.budgets.editAmountPrompt : Strings.budgets.budgetAmountLabel}
              </Text>
              <View
                style={[
                  styles.amountInputRow,
                  { backgroundColor: theme.surfaceSubtle, borderColor: theme.border },
                ]}
              >
                <TextInput
                  value={amountStr}
                  onChangeText={onChangeAmount}
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

              {/* Actions */}
              <View style={styles.modalActionRow}>
                <Button
                  title={isEdit ? Strings.budgets.saveChanges : Strings.budgets.saveBudget}
                  onPress={onSubmit}
                  loading={submitting}
                  variant="primary"
                />

                {isEdit && onDelete && (
                  <Button
                    title={Strings.budgets.deleteBudget}
                    onPress={onDelete}
                    variant="ghost"
                    style={{ marginTop: Spacing.xs }}
                  />
                )}
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    borderTopWidth: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
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
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  categoryChipsScroll: {
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  categorySelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 54,
    marginBottom: Spacing.md,
  },
  amountInput: {
    flex: 1,
    fontWeight: '700',
  },
  modalActionRow: {
    marginTop: Spacing.sm,
  },
});
