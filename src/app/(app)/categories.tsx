import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useColorScheme,
  TouchableOpacity,
  I18nManager,
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
} from '../../constants/theme';
import { Strings } from '../../constants/strings';
import {
  BackButton,
  ErrorBanner,
  LoadingView,
  ConfirmModal,
  EmptyState,
  CategoryListItem,
  CategoryFormModal,
} from '../../components';
import api from '../../services/api';
import { Category, CategoryType } from '../../types/models';
import { GetCategoriesResponse } from '../../types/api';
import { getErrorMessage } from '../../utils/errors';

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

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setFormName('');
    setFormType(activeTab === 'income' ? 'income' : 'expense');
    setFormIcon(activeTab === 'income' ? 'cash-outline' : 'cart-outline');
    setNameError(null);
    setIsFormVisible(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormType(category.type);
    setFormIcon(category.icon || (category.type === 'income' ? 'cash-outline' : 'cart-outline'));
    setNameError(null);
    setIsFormVisible(true);
  };

  const handleSaveCategory = async () => {
    const trimmed = formName.trim();
    if (!trimmed) {
      setNameError(Strings.categories.nameRequired);
      return;
    }

    const isDuplicate = categories.some((c) => {
      if (editingCategory && c.id === editingCategory.id) return false;
      return c.name.trim().toLowerCase() === trimmed.toLowerCase();
    });

    if (isDuplicate) {
      setNameError(Strings.categories.duplicateNameError);
      return;
    }

    try {
      setSubmitting(true);
      setNameError(null);

      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, {
          name: trimmed,
          type: formType,
          icon: formIcon,
        });
      } else {
        await api.post('/categories', {
          name: trimmed,
          type: formType,
          icon: formIcon,
        });
      }

      setIsFormVisible(false);
      fetchCategories();
    } catch (err: unknown) {
      setNameError(getErrorMessage(err, Strings.common.errorOccurred));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await api.delete(`/categories/${categoryToDelete.id}`);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err, Strings.common.errorOccurred));
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (activeTab === 'expense') return c.type === 'expense';
    if (activeTab === 'income') return c.type === 'income';
    return true;
  });

  const expenseCount = categories.filter((c) => c.type === 'expense').length;
  const incomeCount = categories.filter((c) => c.type === 'income').length;

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
      <View style={[styles.tabsContainer, { backgroundColor: theme.surfaceSubtle }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('all')}
          style={[
            styles.tabOption,
            activeTab === 'all' && [styles.tabOptionActive, { backgroundColor: theme.surface }, Shadows.subtle],
          ]}
        >
          <Text
            style={[
              Typography.caption,
              styles.tabText,
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
            styles.tabOption,
            activeTab === 'expense' && [styles.tabOptionActive, { backgroundColor: theme.surface }, Shadows.subtle],
          ]}
        >
          <Text
            style={[
              Typography.caption,
              styles.tabText,
              {
                color: activeTab === 'expense' ? theme.expense : theme.textSecondary,
                fontWeight: activeTab === 'expense' ? '700' : '500',
              },
            ]}
          >
            {Strings.categories.filterExpense} ({expenseCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setActiveTab('income')}
          style={[
            styles.tabOption,
            activeTab === 'income' && [styles.tabOptionActive, { backgroundColor: theme.surface }, Shadows.subtle],
          ]}
        >
          <Text
            style={[
              Typography.caption,
              styles.tabText,
              {
                color: activeTab === 'income' ? theme.income : theme.textSecondary,
                fontWeight: activeTab === 'income' ? '700' : '500',
              },
            ]}
          >
            {Strings.categories.filterIncome} ({incomeCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <LoadingView />
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
              icon="grid-outline"
              title={Strings.categories.emptyCategories}
              actionTitle={Strings.categories.addFirstCategory}
              onAction={handleOpenAdd}
            />
          ) : (
            <View style={styles.categoriesList}>
              {filteredCategories.map((category) => (
                <CategoryListItem
                  key={category.id}
                  category={category}
                  onEdit={() => handleOpenEdit(category)}
                  onDelete={() => {
                    setDeleteError(null);
                    setCategoryToDelete(category);
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Add / Edit Category Modal */}
      <CategoryFormModal
        visible={isFormVisible}
        editingCategory={editingCategory}
        formName={formName}
        onChangeName={(text) => {
          setFormName(text);
          if (nameError) setNameError(null);
        }}
        formType={formType}
        onChangeType={setFormType}
        formIcon={formIcon}
        onChangeIcon={setFormIcon}
        nameError={nameError}
        submitting={submitting}
        onSubmit={handleSaveCategory}
        onClose={() => setIsFormVisible(false)}
      />

      {/* Delete Confirmation Modal (Transactions become uncategorized note) */}
      <ConfirmModal
        visible={Boolean(categoryToDelete)}
        title={Strings.categories.deleteCategoryNoticeTitle}
        message={
          categoryToDelete
            ? Strings.categories.deleteCategoryNoticeBody(categoryToDelete.name)
            : ''
        }
        confirmLabel={Strings.categories.confirmDeleteCategory}
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />
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
    paddingVertical: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleWrapper: {
    marginHorizontal: Spacing.sm,
  },
  title: {
    fontWeight: '800',
  },
  addHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    gap: 4,
  },
  addHeaderText: {
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    borderRadius: Radii.lg,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  tabOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.md,
  },
  tabOptionActive: {
    borderRadius: Radii.md,
  },
  tabText: {
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  categoriesList: {
    gap: Spacing.xs,
  },
});
