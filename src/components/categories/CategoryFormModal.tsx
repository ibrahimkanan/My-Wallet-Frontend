import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Category, CategoryType } from '../../types/models';
import { useLanguage } from '../../i18n';

export interface PresetIconItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const PRESET_ICON_LABELS: Record<string, { ar: string; en: string }> = {
  'cart-outline': { ar: 'تسوق', en: 'Shopping' },
  'restaurant-outline': { ar: 'طعام', en: 'Food' },
  'car-outline': { ar: 'مواصلات', en: 'Transport' },
  'flash-outline': { ar: 'فواتير', en: 'Bills' },
  'home-outline': { ar: 'سكن', en: 'Housing' },
  'medkit-outline': { ar: 'صحة', en: 'Health' },
  'film-outline': { ar: 'ترفيه', en: 'Entertainment' },
  'school-outline': { ar: 'تعليم', en: 'Education' },
  'airplane-outline': { ar: 'سفر', en: 'Travel' },
  'gift-outline': { ar: 'هدايا', en: 'Gifts' },
  'fitness-outline': { ar: 'رياضة', en: 'Fitness' },
  'shirt-outline': { ar: 'ملابس', en: 'Clothing' },
  'cafe-outline': { ar: 'كافيه', en: 'Cafe' },
  'cash-outline': { ar: 'راتب', en: 'Salary' },
  'trending-up-outline': { ar: 'استثمار', en: 'Investment' },
  'briefcase-outline': { ar: 'عمل حر', en: 'Freelance' },
  'wallet-outline': { ar: 'مكافأة', en: 'Bonus' },
  'pricetag-outline': { ar: 'أخرى', en: 'Other' },
};

export const CATEGORY_PRESET_ICONS: PresetIconItem[] = [
  { name: 'cart-outline', icon: 'cart-outline', label: 'تسوق' },
  { name: 'restaurant-outline', icon: 'restaurant-outline', label: 'طعام' },
  { name: 'car-outline', icon: 'car-outline', label: 'مواصلات' },
  { name: 'flash-outline', icon: 'flash-outline', label: 'فواتير' },
  { name: 'home-outline', icon: 'home-outline', label: 'سكن' },
  { name: 'medkit-outline', icon: 'medkit-outline', label: 'صحة' },
  { name: 'film-outline', icon: 'film-outline', label: 'ترفيه' },
  { name: 'school-outline', icon: 'school-outline', label: 'تعليم' },
  { name: 'airplane-outline', icon: 'airplane-outline', label: 'سفر' },
  { name: 'gift-outline', icon: 'gift-outline', label: 'هدايا' },
  { name: 'fitness-outline', icon: 'fitness-outline', label: 'رياضة' },
  { name: 'shirt-outline', icon: 'shirt-outline', label: 'ملابس' },
  { name: 'cafe-outline', icon: 'cafe-outline', label: 'كافيه' },
  { name: 'cash-outline', icon: 'cash-outline', label: 'راتب' },
  { name: 'trending-up-outline', icon: 'trending-up-outline', label: 'استثمار' },
  { name: 'briefcase-outline', icon: 'briefcase-outline', label: 'عمل حر' },
  { name: 'wallet-outline', icon: 'wallet-outline', label: 'مكافأة' },
  { name: 'pricetag-outline', icon: 'pricetag-outline', label: 'أخرى' },
];

interface CategoryFormModalProps {
  visible: boolean;
  editingCategory: Category | null;
  formName: string;
  onChangeName: (text: string) => void;
  formType: CategoryType;
  onChangeType: (type: CategoryType) => void;
  formIcon: string;
  onChangeIcon: (icon: string) => void;
  nameError: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export function CategoryFormModal({
  visible,
  editingCategory,
  formName,
  onChangeName,
  formType,
  onChangeType,
  formIcon,
  onChangeIcon,
  nameError,
  submitting,
  onSubmit,
  onClose,
}: CategoryFormModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { language, isRTL, strings } = useLanguage();
  const activeBadgeColor = formType === 'expense' ? theme.expense : theme.income;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.modalBackdrop, { backgroundColor: theme.modalBackdrop }]}
      >
        <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[Typography.title3, styles.modalTitle, { color: theme.textPrimary }]}>
              {editingCategory ? strings.categories.editCategory : strings.categories.addCategory}
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              style={[styles.modalCloseButton, { backgroundColor: theme.surfaceSubtle }]}
            >
              <Ionicons name="close" size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Type Switcher (Expense / Income) */}
            <Text
              style={[
                Typography.subhead,
                styles.formSectionLabel,
                { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {strings.categories.categoryTypeLabel}
            </Text>

            <View style={[styles.typeSelectorRow, { backgroundColor: theme.surfaceSubtle, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onChangeType('expense')}
                style={[
                  styles.typeSelectorOption,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  formType === 'expense' && [
                    styles.typeSelectorOptionActive,
                    { backgroundColor: theme.surface },
                    Shadows.subtle,
                  ],
                ]}
              >
                <Ionicons
                  name="arrow-up"
                  size={16}
                  color={formType === 'expense' ? theme.expense : theme.textSecondary}
                  style={{ marginHorizontal: 4 }}
                />
                <Text
                  style={[
                    Typography.subhead,
                    {
                      color: formType === 'expense' ? theme.expense : theme.textSecondary,
                      fontWeight: formType === 'expense' ? '700' : '500',
                    },
                  ]}
                >
                  {strings.home.typeExpense}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onChangeType('income')}
                style={[
                  styles.typeSelectorOption,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  formType === 'income' && [
                    styles.typeSelectorOptionActive,
                    { backgroundColor: theme.surface },
                    Shadows.subtle,
                  ],
                ]}
              >
                <Ionicons
                  name="arrow-down"
                  size={16}
                  color={formType === 'income' ? theme.income : theme.textSecondary}
                  style={{ marginHorizontal: 4 }}
                />
                <Text
                  style={[
                    Typography.subhead,
                    {
                      color: formType === 'income' ? theme.income : theme.textSecondary,
                      fontWeight: formType === 'income' ? '700' : '500',
                    },
                  ]}
                >
                  {strings.home.typeIncome}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category Name Input */}
            <Input
              label={strings.categories.categoryNameLabel}
              placeholder={strings.categories.categoryNamePlaceholder}
              value={formName}
              onChangeText={onChangeName}
              error={nameError}
              autoFocus={true}
            />

            {/* Preset Icon Grid */}
            <Text
              style={[
                Typography.subhead,
                styles.formSectionLabel,
                { color: theme.textSecondary, marginTop: Spacing.sm, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {strings.categories.categoryIconLabel}
            </Text>

            <View style={styles.iconGrid}>
              {CATEGORY_PRESET_ICONS.map((item) => {
                const isSelected = formIcon === item.name;
                const itemLabel = PRESET_ICON_LABELS[item.name]?.[language] || item.label;

                return (
                  <TouchableOpacity
                    key={item.name}
                    activeOpacity={0.7}
                    onPress={() => onChangeIcon(item.name)}
                    style={[
                      styles.iconGridItem,
                      {
                        backgroundColor: isSelected ? `${activeBadgeColor}15` : theme.surfaceSubtle,
                        borderColor: isSelected ? activeBadgeColor : theme.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={isSelected ? activeBadgeColor : theme.textSecondary}
                    />
                    <Text
                      style={[
                        Typography.caption,
                        styles.iconLabel,
                        {
                          color: isSelected ? activeBadgeColor : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {itemLabel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <Button
                title={editingCategory ? strings.categories.saveChanges : strings.categories.saveCategory}
                onPress={onSubmit}
                loading={submitting}
                style={styles.modalSubmitButton}
              />
              <Button
                title={strings.common.cancel}
                onPress={onClose}
                variant="secondary"
                disabled={submitting}
              />
            </View>
          </ScrollView>
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
  modalSheet: {
    borderTopLeftRadius: Radii.xxl,
    borderTopRightRadius: Radii.xxl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontWeight: '700',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  formSectionLabel: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    borderRadius: Radii.lg,
    padding: 3,
    marginBottom: Spacing.md,
  },
  typeSelectorOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    gap: Spacing.xs,
  },
  typeSelectorOptionActive: {
    borderRadius: Radii.md,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  iconGridItem: {
    width: '23%',
    aspectRatio: 1,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xs,
  },
  iconLabel: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  modalActionsRow: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalSubmitButton: {
    marginBottom: Spacing.xs,
  },
});
