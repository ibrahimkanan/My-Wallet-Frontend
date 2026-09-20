import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { Button, ErrorBanner, DatePickerModal } from '../../../components/ui';
import api from '../../../services/api';
import { Wallet, Category, Transaction, TransactionType } from '../../../types/models';
import {
  GetWalletsResponse,
  GetCategoriesResponse,
  GetTransactionsResponse,
} from '../../../types/api';
import {
  formatCurrency,
  formatDateToISO,
  formatDateDisplay,
  formatTransactionGroupDate,
} from '../../../utils/formatters';

export default function TransactionFormModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; initialData?: string }>();
  const isEditing = Boolean(params.id);

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  // Form Fields
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [transactionDate, setTransactionDate] = useState<string>(formatDateToISO(new Date()));
  const [note, setNote] = useState<string>('');

  // Data Sources
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Field-level & Form-level Errors
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Custom Date Picker Modal
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Accent colors based on type
  const isIncome = type === 'income';
  const accentColor = isIncome ? theme.income : theme.expense;
  const accentBg = isIncome ? theme.incomeBg : theme.expenseBg;
  const accentBorder = isIncome ? theme.incomeBorder : theme.expenseBorder;

  // Load Wallets, Categories, and Transaction (if editing)
  const loadDependencies = useCallback(async () => {
    try {
      setLoadingInitial(true);
      setGeneralError(null);

      const [walletsRes, categoriesRes] = await Promise.all([
        api.get<GetWalletsResponse>('/wallets'),
        api.get<GetCategoriesResponse>('/categories'),
      ]);

      const loadedWallets = walletsRes.data?.wallets || [];
      const loadedCategories = categoriesRes.data?.categories || [];

      setWallets(loadedWallets);
      setCategories(loadedCategories);

      // Handle Edit Mode prefill
      if (params.id) {
        let existingTx: Transaction | null = null;

        if (params.initialData) {
          try {
            existingTx = JSON.parse(params.initialData);
          } catch (e) {
            console.warn('[TransactionForm] Could not parse initialData param:', e);
          }
        }

        // If not in params, fetch from transactions list
        if (!existingTx) {
          const txRes = await api.get<GetTransactionsResponse>('/transactions?limit=100');
          existingTx = txRes.data?.transactions?.find((t) => t.id === params.id) || null;
        }

        if (existingTx) {
          setType(existingTx.type);
          setAmountStr(String(existingTx.amount));

          // Check if wallet still exists
          const walletStillExists = loadedWallets.some((w) => w.id === existingTx!.wallet_id);
          if (walletStillExists) {
            setSelectedWalletId(existingTx.wallet_id);
          } else {
            // Previously linked wallet was deleted
            setSelectedWalletId(loadedWallets[0]?.id || '');
            setWalletError(Strings.transactionForm.errorWalletNotFound);
          }

          // Check if category still exists
          if (existingTx.category_id) {
            const categoryStillExists = loadedCategories.some((c) => c.id === existingTx!.category_id);
            setSelectedCategoryId(categoryStillExists ? existingTx.category_id : null);
          } else {
            setSelectedCategoryId(null);
          }

          setTransactionDate(existingTx.transaction_date.slice(0, 10));
          setNote(existingTx.note || '');
        } else {
          setGeneralError(Strings.transactionForm.errorFailedToLoad);
        }
      } else {
        // CREATE MODE
        // Rule: If the user only has ONE wallet, skip showing this picker entirely and auto-assign it silently
        if (loadedWallets.length === 1) {
          setSelectedWalletId(loadedWallets[0].id);
        } else if (loadedWallets.length > 1 && !selectedWalletId) {
          setSelectedWalletId(loadedWallets[0].id);
        }
      }
    } catch (err) {
      console.warn('[TransactionForm] Error loading dependencies:', err);
      setGeneralError(Strings.transactionForm.errorFailedToLoad);
    } finally {
      setLoadingInitial(false);
    }
  }, [params.id, params.initialData]);

  useEffect(() => {
    loadDependencies();
  }, [loadDependencies]);

  // Categories filtered by active type (income vs expense)
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => c.type === type);
  }, [categories, type]);

  // Handle Type Toggle
  const handleTypeToggle = (newType: TransactionType) => {
    if (newType === type) return;
    setType(newType);

    // Clear category if it belongs to the previous type
    if (selectedCategoryId) {
      const activeCat = categories.find((c) => c.id === selectedCategoryId);
      if (activeCat && activeCat.type !== newType) {
        setSelectedCategoryId(null);
      }
    }
    setAmountError(null);
    setCategoryError(null);
  };

  // Quick Date Helpers
  const todayISO = formatDateToISO(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayISO = formatDateToISO(yesterday);

  // Submit Handler
  const handleSubmit = async () => {
    // Reset previous errors
    setGeneralError(null);
    setAmountError(null);
    setWalletError(null);
    setCategoryError(null);

    // Validate Amount
    const numericAmount = parseFloat(amountStr);
    if (!amountStr.trim() || isNaN(numericAmount) || numericAmount <= 0) {
      setAmountError(Strings.transactionForm.errorAmountRequired);
      return;
    }

    // Validate Wallet
    let walletIdToUse = selectedWalletId;
    if (!walletIdToUse) {
      if (wallets.length === 1) {
        walletIdToUse = wallets[0].id;
      } else {
        setWalletError(Strings.transactionForm.errorWalletRequired);
        return;
      }
    }

    setSubmitting(true);

    const payload = {
      wallet_id: walletIdToUse,
      category_id: selectedCategoryId || undefined,
      type,
      amount: numericAmount,
      note: note.trim() || undefined,
      transaction_date: transactionDate,
    };

    try {
      if (isEditing && params.id) {
        await api.patch(`/transactions/${params.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }

      // Success: Close modal (screens will auto-refetch updated balances via useFocusEffect)
      router.back();
    } catch (err: any) {
      console.warn('[TransactionForm] Submission error:', err);

      const status = err.response?.status;
      const errorMsg = err.response?.data?.error;

      // Form-level error mapping for 404 WALLET_NOT_FOUND / CATEGORY_NOT_FOUND
      if (status === 404) {
        if (errorMsg === 'Wallet not found') {
          setWalletError(Strings.transactionForm.errorWalletNotFound);
          return;
        }
        if (errorMsg === 'Category not found') {
          setCategoryError(Strings.transactionForm.errorCategoryNotFound);
          return;
        }
      }

      if (status === 400 && err.response?.data?.message) {
        setGeneralError(err.response.data.message);
        return;
      }

      setGeneralError(errorMsg || Strings.transactionForm.errorFailedToSave);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper icon for wallet types
  const getWalletIcon = (wType: string): keyof typeof Ionicons.glyphMap => {
    switch (wType) {
      case 'cash':
        return 'cash-outline';
      case 'card':
        return 'card-outline';
      default:
        return 'business-outline';
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {/* Top Header Bar */}
        <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={submitting}
            onPress={() => router.back()}
            style={[styles.closeButton, { backgroundColor: theme.surfaceSubtle }]}
          >
            <Ionicons name="close" size={20} color={theme.textPrimary} />
          </TouchableOpacity>

          <Text style={[Typography.subhead, styles.topBarTitle, { color: theme.textPrimary }]}>
            {isEditing
              ? Strings.transactionForm.editTitle
              : Strings.transactionForm.addTitle}
          </Text>

          <View style={{ width: 36 }} />
        </View>

        {loadingInitial ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text
              style={[Typography.caption, { color: theme.textSecondary, marginTop: Spacing.sm }]}
            >
              {Strings.common.loading}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* General Error Banner */}
            {generalError && (
              <View style={styles.errorContainer}>
                <ErrorBanner
                  message={generalError}
                  onDismiss={() => setGeneralError(null)}
                />
              </View>
            )}

            {/* TYPE TOGGLE: Income / Expense */}
            <View style={[styles.toggleContainer, { backgroundColor: theme.surfaceSubtle }]}>
              {/* Expense Option */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={submitting}
                onPress={() => handleTypeToggle('expense')}
                style={[
                  styles.toggleOption,
                  type === 'expense' && [
                    styles.toggleActiveExpense,
                    { backgroundColor: theme.expenseBg, borderColor: theme.expenseBorder },
                  ],
                ]}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={18}
                  color={type === 'expense' ? theme.expense : theme.textTertiary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    Typography.subhead,
                    {
                      color: type === 'expense' ? theme.expense : theme.textSecondary,
                      fontWeight: type === 'expense' ? '700' : '500',
                    },
                  ]}
                >
                  {Strings.transactionForm.typeExpense}
                </Text>
              </TouchableOpacity>

              {/* Income Option */}
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={submitting}
                onPress={() => handleTypeToggle('income')}
                style={[
                  styles.toggleOption,
                  type === 'income' && [
                    styles.toggleActiveIncome,
                    { backgroundColor: theme.incomeBg, borderColor: theme.incomeBorder },
                  ],
                ]}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={18}
                  color={type === 'income' ? theme.income : theme.textTertiary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    Typography.subhead,
                    {
                      color: type === 'income' ? theme.income : theme.textSecondary,
                      fontWeight: type === 'income' ? '700' : '500',
                    },
                  ]}
                >
                  {Strings.transactionForm.typeIncome}
                </Text>
              </TouchableOpacity>
            </View>

            {/* AMOUNT HERO INPUT */}
            <View
              style={[
                styles.amountHeroCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: amountError ? theme.expense : accentBorder,
                },
                Shadows.card,
              ]}
            >
              <Text style={[Typography.caption, styles.fieldLabel, { color: theme.textSecondary }]}>
                {Strings.transactionForm.amountLabel}
              </Text>

              <View style={styles.amountInputRow}>
                <Text
                  style={[
                    Typography.moneyHero,
                    styles.amountSign,
                    { color: accentColor },
                  ]}
                >
                  {isIncome ? '+' : '-'}
                </Text>

                <TextInput
                  value={amountStr}
                  editable={!submitting}
                  onChangeText={(val) => {
                    // Allow digits and single decimal point
                    const cleaned = val.replace(/[^0-9.]/g, '');
                    setAmountStr(cleaned);
                    if (amountError) setAmountError(null);
                  }}
                  placeholder={Strings.transactionForm.amountPlaceholder}
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="decimal-pad"
                  style={[
                    Typography.moneyHero,
                    styles.amountTextInput,
                    {
                      color: accentColor,
                      textAlign: I18nManager.isRTL ? 'right' : 'left',
                    },
                  ]}
                  autoFocus={!isEditing}
                />

                <View style={[styles.currencyBadge, { backgroundColor: accentBg }]}>
                  <Text style={[Typography.subhead, { color: accentColor, fontWeight: '700' }]}>
                    {Strings.common.currency}
                  </Text>
                </View>
              </View>

              {amountError && (
                <Text style={[Typography.caption, styles.errorText, { color: theme.expense }]}>
                  {amountError}
                </Text>
              )}
            </View>

            {/* WALLET PICKER
                RULE: if the user only has ONE wallet, skip showing this picker entirely and auto-assign it silently;
                only show the picker when there are 2+ wallets. */}
            {wallets.length === 0 ? (
              <View
                style={[
                  styles.warningBox,
                  { backgroundColor: theme.warningBg, borderColor: theme.warningBorder },
                ]}
              >
                <Ionicons name="warning-outline" size={20} color={theme.warning} />
                <View style={{ flex: 1, marginHorizontal: Spacing.sm }}>
                  <Text style={[Typography.bodyMedium, { color: theme.textPrimary }]}>
                    {Strings.transactionForm.noWalletsWarning}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/wallets' as any)}
                  style={[styles.smallActionBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={[Typography.caption, { color: theme.textInverse, fontWeight: '700' }]}>
                    {Strings.transactionForm.goToAddWallet}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : wallets.length > 1 ? (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[Typography.subhead, styles.sectionTitle, { color: theme.textPrimary }]}>
                    {Strings.transactionForm.walletLabel}
                  </Text>
                  {walletError && (
                    <Text style={[Typography.caption, { color: theme.expense }]}>
                      {walletError}
                    </Text>
                  )}
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsScroll}
                >
                  {wallets.map((wallet) => {
                    const isSelected = selectedWalletId === wallet.id;
                    return (
                      <TouchableOpacity
                        key={wallet.id}
                        activeOpacity={0.75}
                        disabled={submitting}
                        onPress={() => {
                          setSelectedWalletId(wallet.id);
                          setWalletError(null);
                        }}
                        style={[
                          styles.walletSelectCard,
                          {
                            backgroundColor: isSelected ? accentBg : theme.surface,
                            borderColor: isSelected ? accentColor : theme.border,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.walletSelectIcon,
                            {
                              backgroundColor: isSelected ? accentColor : theme.surfaceSubtle,
                            },
                          ]}
                        >
                          <Ionicons
                            name={getWalletIcon(wallet.type)}
                            size={16}
                            color={isSelected ? theme.textInverse : theme.textSecondary}
                          />
                        </View>
                        <View>
                          <Text
                            style={[
                              Typography.caption,
                              {
                                color: isSelected ? theme.textPrimary : theme.textSecondary,
                                fontWeight: isSelected ? '700' : '500',
                              },
                            ]}
                          >
                            {wallet.name}
                          </Text>
                          <Text
                            style={[
                              Typography.caption,
                              {
                                color: isSelected ? accentColor : theme.textTertiary,
                                fontSize: 11,
                              },
                            ]}
                          >
                            {formatCurrency(Number(wallet.balance))}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* CATEGORY PICKER (Filtered to active type) */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[Typography.subhead, styles.sectionTitle, { color: theme.textPrimary }]}>
                  {Strings.transactionForm.categoryLabel}
                </Text>
                {categoryError && (
                  <Text style={[Typography.caption, { color: theme.expense }]}>
                    {categoryError}
                  </Text>
                )}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsScroll}
              >
                {/* Optional "بدون فئة" (Uncategorized) chip */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  disabled={submitting}
                  onPress={() => {
                    setSelectedCategoryId(null);
                    setCategoryError(null);
                  }}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor:
                        selectedCategoryId === null ? accentBg : theme.surface,
                      borderColor:
                        selectedCategoryId === null ? accentColor : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="grid-outline"
                    size={16}
                    color={
                      selectedCategoryId === null ? accentColor : theme.textTertiary
                    }
                  />
                  <Text
                    style={[
                      Typography.caption,
                      styles.chipLabel,
                      {
                        color:
                          selectedCategoryId === null
                            ? accentColor
                            : theme.textSecondary,
                        fontWeight: selectedCategoryId === null ? '700' : '500',
                      },
                    ]}
                  >
                    {Strings.transactionForm.uncategorized}
                  </Text>
                </TouchableOpacity>

                {/* Filtered categories list */}
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      activeOpacity={0.75}
                      disabled={submitting}
                      onPress={() => {
                        setSelectedCategoryId(cat.id);
                        setCategoryError(null);
                      }}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isSelected ? accentBg : theme.surface,
                          borderColor: isSelected ? accentColor : theme.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={(cat.icon as any) || 'pricetag-outline'}
                        size={16}
                        color={isSelected ? accentColor : theme.textSecondary}
                      />
                      <Text
                        style={[
                          Typography.caption,
                          styles.chipLabel,
                          {
                            color: isSelected ? accentColor : theme.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* DATE PICKER */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[Typography.subhead, styles.sectionTitle, { color: theme.textPrimary }]}>
                  {Strings.transactionForm.dateLabel}
                </Text>
              </View>

              {/* Quick Selectors + Custom Date Action */}
              <View style={styles.dateSelectorRow}>
                {/* Today */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  disabled={submitting}
                  onPress={() => setTransactionDate(todayISO)}
                  style={[
                    styles.dateOptionChip,
                    {
                      backgroundColor:
                        transactionDate === todayISO ? accentBg : theme.surface,
                      borderColor:
                        transactionDate === todayISO ? accentColor : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      Typography.caption,
                      {
                        color:
                          transactionDate === todayISO
                            ? accentColor
                            : theme.textPrimary,
                        fontWeight: transactionDate === todayISO ? '700' : '500',
                      },
                    ]}
                  >
                    {Strings.transactionForm.today}
                  </Text>
                </TouchableOpacity>

                {/* Yesterday */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  disabled={submitting}
                  onPress={() => setTransactionDate(yesterdayISO)}
                  style={[
                    styles.dateOptionChip,
                    {
                      backgroundColor:
                        transactionDate === yesterdayISO ? accentBg : theme.surface,
                      borderColor:
                        transactionDate === yesterdayISO ? accentColor : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      Typography.caption,
                      {
                        color:
                          transactionDate === yesterdayISO
                            ? accentColor
                            : theme.textPrimary,
                        fontWeight:
                          transactionDate === yesterdayISO ? '700' : '500',
                      },
                    ]}
                  >
                    {Strings.transactionForm.yesterday}
                  </Text>
                </TouchableOpacity>

                {/* Custom Date Picker Trigger */}
                <TouchableOpacity
                  activeOpacity={0.75}
                  disabled={submitting}
                  onPress={() => setShowDatePicker(true)}
                  style={[
                    styles.dateOptionChip,
                    styles.customDateChip,
                    {
                      backgroundColor:
                        transactionDate !== todayISO &&
                        transactionDate !== yesterdayISO
                          ? accentBg
                          : theme.surface,
                      borderColor:
                        transactionDate !== todayISO &&
                        transactionDate !== yesterdayISO
                          ? accentColor
                          : theme.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={
                      transactionDate !== todayISO &&
                      transactionDate !== yesterdayISO
                        ? accentColor
                        : theme.textSecondary
                    }
                  />
                  <Text
                    style={[
                      Typography.caption,
                      styles.chipLabel,
                      {
                        color:
                          transactionDate !== todayISO &&
                          transactionDate !== yesterdayISO
                            ? accentColor
                            : theme.textPrimary,
                        fontWeight:
                          transactionDate !== todayISO &&
                          transactionDate !== yesterdayISO
                            ? '700'
                            : '500',
                      },
                    ]}
                  >
                    {formatDateDisplay(transactionDate)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* NOTE INPUT */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[Typography.subhead, styles.sectionTitle, { color: theme.textPrimary }]}>
                  {Strings.transactionForm.noteLabel}
                </Text>
                <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                  {note.length}/500
                </Text>
              </View>

              <View
                style={[
                  styles.noteInputWrapper,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TextInput
                  value={note}
                  editable={!submitting}
                  onChangeText={setNote}
                  placeholder={Strings.transactionForm.notePlaceholder}
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  maxLength={500}
                  style={[
                    Typography.bodyMedium,
                    styles.noteInput,
                    {
                      color: theme.textPrimary,
                      textAlign: I18nManager.isRTL ? 'right' : 'left',
                    },
                  ]}
                />
              </View>
            </View>

            {/* SAVE BUTTON */}
            <View style={styles.submitRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={submitting}
                onPress={handleSubmit}
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: accentColor,
                    opacity: submitting ? 0.7 : 1,
                  },
                  Shadows.card,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color={theme.textInverse} size="small" />
                ) : (
                  <View style={styles.submitBtnContent}>
                    <Ionicons
                      name={isEditing ? 'checkmark-circle' : 'add-circle'}
                      size={20}
                      color={theme.textInverse}
                      style={{ marginRight: Spacing.xs }}
                    />
                    <Text style={[Typography.headline, { color: theme.textInverse, fontWeight: '700' }]}>
                      {isEditing
                        ? Strings.transactionForm.saveChanges
                        : Strings.transactionForm.saveTransaction}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* DatePickerModal for Custom Date */}
        <DatePickerModal
          visible={showDatePicker}
          initialDate={transactionDate}
          onSelect={(newDate) => {
            setTransactionDate(newDate);
          }}
          onClose={() => setShowDatePicker(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  topBarTitle: {
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  errorContainer: {
    marginBottom: Spacing.md,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleActiveExpense: {
    borderRadius: Radii.md,
  },
  toggleActiveIncome: {
    borderRadius: Radii.md,
  },
  amountHeroCard: {
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountSign: {
    marginRight: Spacing.xs,
  },
  amountTextInput: {
    flex: 1,
    padding: 0,
  },
  currencyBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    marginLeft: Spacing.xs,
  },
  errorText: {
    marginTop: Spacing.xs,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  chipsScroll: {
    paddingVertical: 2,
    gap: Spacing.sm,
  },
  walletSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    gap: Spacing.xs,
  },
  walletSelectIcon: {
    width: 30,
    height: 30,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  smallActionBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.full,
    borderWidth: 1.5,
  },
  chipLabel: {
    marginLeft: 6,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateOptionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
  },
  customDateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noteInputWrapper: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.sm,
    minHeight: 80,
  },
  noteInput: {
    flex: 1,
    textAlignVertical: 'top',
  },
  submitRow: {
    marginTop: Spacing.md,
  },
  submitButton: {
    height: 52,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
