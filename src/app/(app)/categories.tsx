import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ThemeColors,
  Typography,
  Spacing,
  Radii,
  Shadows,
  BrandColors,
} from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Button, Input, BackButton, ErrorBanner } from '../../components/ui';
import { EmptyState } from '../../components/home';
import api from '../../services/api';
import { Category, CategoryType } from '../../types/models';
import { GetCategoriesResponse } from '../../types/api';
import { getErrorMessage } from '../../utils/errors';

interface PresetIconItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const CATEGORY_PRESET_ICONS: PresetIconItem[] = [
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

export default function CategoriesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Active filter tab: 'all' | 'expense' | 'income'
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');

  // Form Modal State (Add / Edit)
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<CategoryType>('expense');
  const [formIcon, setFormIcon] = useState<string>('cart-outline');
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await api.get<GetCategoriesResponse>('/categories');
      if (res.data?.categories) {
        setCategories(res.data.categories);
      }
    } catch (err) {
      console.warn('[Categories] Failed to load categories:', err);
      setFetchError(getErrorMessage(err, Strings.common.errorOccurred));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  // Open modal to add category
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormType(activeTab === 'income' ? 'income' : 'expense');
    setFormIcon(activeTab === 'income' ? 'cash-outline' : 'cart-outline');
    setNameError(null);
    setIsFormVisible(true);
  };

  // Open modal to edit category
  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormType(category.type);
    setFormIcon(category.icon || (category.type === 'income' ? 'cash-outline' : 'cart-outline'));
    setNameError(null);
    setIsFormVisible(true);
  };

  // Client-side and server-side duplicate check
  const handleSaveCategory = async () => {
    const trimmed = formName.trim();
    if (!trimmed) {
      setNameError(Strings.categories.nameRequired);
      return;
    }

    // 1. Client-side duplicate check
    const isDuplicate = categories.some((c) => {
      if (editingCategory && c.id === editingCategory.id) return false;
      return c.name.trim().toLowerCase() === trimmed.toLowerCase();
    });

    if (isDuplicate) {
      setNameError(Strings.categories.duplicateNameError);
      return;
    }

    setSubmitting(true);
    setNameError(null);

    try {
      if (editingCategory) {
        // PATCH /categories/:id
        await api.patch(`/categories/${editingCategory.id}`, {
          name: trimmed,
          type: formType,
          icon: formIcon,
        });
      } else {
        // POST /categories
        await api.post('/categories', {
          name: trimmed,
          type: formType,
          icon: formIcon,
        });
      }

      setIsFormVisible(false);
      fetchCategories();
    } catch (err: any) {
      // 2. Server-side duplicate check (HTTP 400 or duplicate message)
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.error || err?.response?.data?.message || '';

      if (
        status === 400 &&
        (serverMessage.includes('ALREADY_EXISTS') ||
          serverMessage.includes('already exists') ||
          serverMessage.includes('duplicate') ||
          serverMessage.includes('UNIQUE'))
      ) {
        setNameError(Strings.categories.duplicateNameError);
      } else {
        setNameError(getErrorMessage(err, Strings.common.errorOccurred));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Safe category deletion (Transactions become uncategorized)
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      // DELETE /categories/:id
      await api.delete(`/categories/${categoryToDelete.id}`);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err, Strings.common.errorOccurred));
    } finally {
      setDeleting(false);
    }
  };

  // Filtered list
  const filteredCategories = categories.filter((cat) => {
    if (activeTab === 'all') return true;
    return cat.type === activeTab;
  });

  const getValidIconName = (iconStr?: string | null): keyof typeof Ionicons.glyphMap => {
    if (!iconStr) return 'pricetag-outline';
    const found = CATEGORY_PRESET_ICONS.find((p) => p.name === iconStr);
    return found ? found.icon : 'pricetag-outline';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <BackButton onPress={() => router.back()} />
          <View style={styles.titleWrapper}>
            <Text
              style={[
                Typography.title2,
                styles.title,
                { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            >
              {Strings.categories.title}
            </Text>
            <Text
              style={[
                Typography.caption,
                { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            >
              {Strings.categories.subtitle}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenAdd}
          style={[styles.addHeaderButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={[Typography.subhead, styles.addHeaderText, { color: '#FFFFFF' }]}>
            {Strings.categories.addCategory}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs (All / Expenses / Income) */}
      <View style={[styles.filterBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('all')}
          style={[
            styles.filterTab,
            activeTab === 'all' && [styles.filterTabActive, { borderBottomColor: theme.primary }],
          ]}
        >
          <Text
            style={[
              Typography.subhead,
              styles.filterTabText,
              {
                color: activeTab === 'all' ? theme.primary : theme.textSecondary,
                fontWeight: activeTab === 'all' ? '700' : '500',
              },
            ]}
          >
            {Strings.categories.filterAll} ({categories.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('expense')}
          style={[
            styles.filterTab,
            activeTab === 'expense' && [styles.filterTabActive, { borderBottomColor: theme.expense }],
          ]}
        >
          <Text
            style={[
              Typography.subhead,
              styles.filterTabText,
              {
                color: activeTab === 'expense' ? theme.expense : theme.textSecondary,
                fontWeight: activeTab === 'expense' ? '700' : '500',
              },
            ]}
          >
            {Strings.categories.filterExpense} ({categories.filter((c) => c.type === 'expense').length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('income')}
          style={[
            styles.filterTab,
            activeTab === 'income' && [styles.filterTabActive, { borderBottomColor: theme.income }],
          ]}
        >
          <Text
            style={[
              Typography.subhead,
              styles.filterTabText,
              {
                color: activeTab === 'income' ? theme.income : theme.textSecondary,
                fontWeight: activeTab === 'income' ? '700' : '500',
              },
            ]}
          >
            {Strings.categories.filterIncome} ({categories.filter((c) => c.type === 'income').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Error Banner when categories exist */}
          {fetchError && categories.length > 0 && (
            <View style={{ marginBottom: Spacing.md }}>
              <ErrorBanner message={fetchError} onDismiss={() => setFetchError(null)} />
            </View>
          )}

          {fetchError && categories.length === 0 ? (
            <EmptyState
              icon="alert-circle-outline"
              title={fetchError}
              subtitle={Strings.common.networkError}
              actionTitle={Strings.common.retry}
              onAction={fetchCategories}
            />
          ) : filteredCategories.length === 0 ? (
            <EmptyState
              icon="pricetag-outline"
              title={Strings.categories.emptyCategories}
              actionTitle={Strings.categories.addFirstCategory}
              onAction={handleOpenAdd}
            />
          ) : (
            <View style={styles.categoriesGrid}>
              {filteredCategories.map((category) => {
                const isExpense = category.type === 'expense';
                const badgeColor = isExpense ? theme.expense : theme.income;
                const iconName = getValidIconName(category.icon);

                return (
                  <View
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      Shadows.card,
                    ]}
                  >
                    <View style={styles.cardMainRow}>
                      <View style={styles.cardLeftCol}>
                        <View
                          style={[
                            styles.categoryIconBox,
                            { backgroundColor: `${badgeColor}15` },
                          ]}
                        >
                          <Ionicons name={iconName} size={22} color={badgeColor} />
                        </View>
                        <View style={styles.categoryTextCol}>
                          <Text
                            style={[
                              Typography.headline,
                              styles.categoryName,
                              { color: theme.textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            {category.name}
                          </Text>
                          <View
                            style={[
                              styles.typeBadge,
                              { backgroundColor: `${badgeColor}12` },
                            ]}
                          >
                            <Text
                              style={[
                                Typography.caption,
                                { color: badgeColor, fontWeight: '700' },
                              ]}
                            >
                              {isExpense ? Strings.home.typeExpense : Strings.home.typeIncome}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Action buttons */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleOpenEdit(category)}
                          style={[
                            styles.actionButton,
                            { backgroundColor: theme.surfaceSubtle },
                          ]}
                          accessibilityLabel={Strings.common.edit}
                        >
                          <Ionicons name="pencil" size={16} color={theme.textPrimary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setCategoryToDelete(category)}
                          style={[
                            styles.actionButton,
                            { backgroundColor: `${theme.expense}15` },
                          ]}
                          accessibilityLabel={Strings.common.delete}
                        >
                          <Ionicons name="trash-outline" size={16} color={theme.expense} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Add / Edit Category Modal */}
      <Modal
        visible={isFormVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFormVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[Typography.title3, styles.modalTitle, { color: theme.textPrimary }]}>
                {editingCategory ? Strings.categories.editCategory : Strings.categories.addCategory}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setIsFormVisible(false)}
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
                  { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              >
                {Strings.categories.categoryTypeLabel}
              </Text>

              <View style={[styles.typeSelectorRow, { backgroundColor: theme.surfaceSubtle }]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setFormType('expense')}
                  style={[
                    styles.typeSelectorOption,
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
                    {Strings.home.typeExpense}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setFormType('income')}
                  style={[
                    styles.typeSelectorOption,
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
                    {Strings.home.typeIncome}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Category Name Input WITH INLINE VALIDATION ERROR */}
              <Input
                label={Strings.categories.categoryNameLabel}
                placeholder={Strings.categories.categoryNamePlaceholder}
                value={formName}
                onChangeText={(text) => {
                  setFormName(text);
                  if (nameError) setNameError(null);
                }}
                error={nameError}
                autoFocus={true}
              />

              {/* Preset Icon Grid */}
              <Text
                style={[
                  Typography.subhead,
                  styles.formSectionLabel,
                  { color: theme.textSecondary, marginTop: Spacing.sm, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              >
                {Strings.categories.categoryIconLabel}
              </Text>

              <View style={styles.iconGrid}>
                {CATEGORY_PRESET_ICONS.map((item) => {
                  const isSelected = formIcon === item.name;
                  const activeBadgeColor = formType === 'expense' ? theme.expense : theme.income;

                  return (
                    <TouchableOpacity
                      key={item.name}
                      activeOpacity={0.7}
                      onPress={() => setFormIcon(item.name)}
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
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <Button
                  title={editingCategory ? Strings.categories.saveChanges : Strings.categories.saveCategory}
                  onPress={handleSaveCategory}
                  loading={submitting}
                  style={styles.modalSubmitButton}
                />
                <Button
                  title={Strings.common.cancel}
                  onPress={() => setIsFormVisible(false)}
                  variant="secondary"
                  disabled={submitting}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Confirmation Modal (SAFE NOTICE: Transactions become uncategorized) */}
      <Modal
        visible={!!categoryToDelete}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCategoryToDelete(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.deleteDialog,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
              Shadows.elevated,
            ]}
          >
            {/* Soft Notice Icon Badge */}
            <View style={[styles.noticeIconBadge, { backgroundColor: theme.primaryMuted }]}>
              <Ionicons name="information-circle" size={40} color={theme.primary} />
            </View>

            {/* Notice Title */}
            <Text style={[Typography.title2, styles.deleteDialogTitle, { color: theme.textPrimary }]}>
              {Strings.categories.deleteCategoryNoticeTitle}
            </Text>

            {/* Reassurance Body (transactions are NOT deleted, they become uncategorized) */}
            <Text style={[Typography.body, styles.deleteDialogBody, { color: theme.textSecondary }]}>
              {categoryToDelete ? Strings.categories.deleteCategoryNoticeBody(categoryToDelete.name) : ''}
            </Text>

            {deleteError ? (
              <Text style={[Typography.caption, styles.dialogErrorText, { color: theme.expense }]}>
                {deleteError}
              </Text>
            ) : null}

            {/* Actions */}
            <View style={styles.deleteDialogActions}>
              <Button
                title={Strings.categories.confirmDeleteCategory}
                onPress={handleConfirmDelete}
                variant="danger"
                loading={deleting}
              />
              <Button
                title={Strings.common.cancel}
                onPress={() => setCategoryToDelete(null)}
                variant="secondary"
                disabled={deleting}
                style={{ marginTop: Spacing.sm }}
              />
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  titleWrapper: {
    marginTop: Spacing.xs,
  },
  title: {
    fontWeight: '800',
  },
  addHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    marginStart: Spacing.sm,
  },
  addHeaderText: {
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.lg,
  },
  filterTab: {
    paddingVertical: Spacing.md,
    marginEnd: Spacing.xl,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomWidth: 2,
  },
  filterTabText: {},
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  categoriesGrid: {
    gap: Spacing.sm,
  },
  categoryCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  categoryIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTextCol: {
    flex: 1,
  },
  categoryName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
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
    padding: Spacing.xl,
  },
  formSectionLabel: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: Radii.lg,
    marginBottom: Spacing.lg,
  },
  typeSelectorOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
  },
  typeSelectorOptionActive: {
    borderRadius: Radii.md,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  iconGridItem: {
    width: '30%',
    flexGrow: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    marginTop: 4,
    textAlign: 'center',
  },
  modalActionsRow: {
    gap: Spacing.sm,
  },
  modalSubmitButton: {
    marginBottom: Spacing.xs,
  },
  deleteDialog: {
    marginHorizontal: Spacing.xl,
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 400,
    width: '90%',
  },
  noticeIconBadge: {
    width: 72,
    height: 72,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  deleteDialogTitle: {
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  deleteDialogBody: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
  },
  dialogErrorText: {
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  deleteDialogActions: {
    width: '100%',
  },
});
