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
import { useRouter, useFocusEffect } from 'expo-router';
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
import { Button, Input, BackButton, WalletTypeCard, ErrorBanner } from '../../components/ui';
import { EmptyState } from '../../components/home';
import api from '../../services/api';
import { Wallet, WalletType } from '../../types/models';
import { GetWalletsResponse } from '../../types/api';
import { formatCurrency } from '../../utils/formatters';
import { getErrorMessage } from '../../utils/errors';

export default function WalletsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form Modal State (Add / Edit)
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<WalletType>('bank');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchWallets = useCallback(async () => {
    try {
      setFetchError(null);
      const res = await api.get<GetWalletsResponse>('/wallets');
      if (res.data?.wallets) {
        setWallets(res.data.wallets);
      }
    } catch (err) {
      console.warn('[Wallets] Failed to load wallets:', err);
      setFetchError(getErrorMessage(err, Strings.common.errorOccurred));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchWallets();
    }, [fetchWallets])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchWallets();
  };

  // Open modal to add wallet
  const handleOpenAdd = () => {
    setEditingWallet(null);
    setFormName('');
    setFormType('bank');
    setFormError(null);
    setIsFormVisible(true);
  };

  // Open modal to edit wallet
  const handleOpenEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormName(wallet.name);
    setFormType(wallet.type);
    setFormError(null);
    setIsFormVisible(true);
  };

  // Save (Create or Update)
  const handleSaveWallet = async () => {
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError(Strings.wallets.nameRequired);
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingWallet) {
        // PATCH /wallets/:id
        await api.patch(`/wallets/${editingWallet.id}`, {
          name: trimmed,
          type: formType,
        });
      } else {
        // POST /wallets
        await api.post('/wallets', {
          name: trimmed,
          type: formType,
        });
      }

      setIsFormVisible(false);
      fetchWallets();
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, Strings.common.errorOccurred));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete confirmation
  const handleConfirmDelete = async () => {
    if (!walletToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      // DELETE /wallets/:id
      await api.delete(`/wallets/${walletToDelete.id}`);
      setWalletToDelete(null);
      fetchWallets();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err, Strings.common.errorOccurred));
    } finally {
      setDeleting(false);
    }
  };

  const getWalletIcon = (type: WalletType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'bank':
        return 'business-outline';
      case 'card':
        return 'card-outline';
      case 'cash':
      default:
        return 'cash-outline';
    }
  };

  const totalBalance = wallets.reduce(
    (acc, w) => acc + (Number(w.balance) || 0),
    0
  );

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
              {Strings.wallets.title}
            </Text>
            <Text
              style={[
                Typography.caption,
                { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            >
              {Strings.wallets.subtitle}
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
            {Strings.wallets.addWallet}
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
          {/* Error Banner when wallets already exist */}
          {fetchError && wallets.length > 0 && (
            <View style={{ marginBottom: Spacing.md }}>
              <ErrorBanner message={fetchError} onDismiss={() => setFetchError(null)} />
            </View>
          )}

          {/* Total Assets Summary Banner */}
          <View
            style={[
              styles.summaryBanner,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.card,
            ]}
          >
            <View style={styles.summaryRow}>
              <View>
                <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                  {Strings.wallets.totalBalanceLabel}
                </Text>
                <Text
                  style={[
                    Typography.moneyHero,
                    {
                      color: totalBalance >= 0 ? theme.textPrimary : theme.expense,
                      textAlign: I18nManager.isRTL ? 'right' : 'left',
                    },
                  ]}
                >
                  {formatCurrency(totalBalance)}
                </Text>
              </View>

              <View style={[styles.walletCountBadge, { backgroundColor: theme.primaryMuted }]}>
                <Ionicons name="wallet" size={16} color={theme.primary} />
                <Text style={[Typography.subhead, { color: theme.primary, fontWeight: '700' }]}>
                  {Strings.dashboard.accountsUnit(wallets.length)}
                </Text>
              </View>
            </View>
          </View>

          {/* Wallets List */}
          {fetchError && wallets.length === 0 ? (
            <EmptyState
              icon="alert-circle-outline"
              title={fetchError}
              subtitle={Strings.common.networkError}
              actionTitle={Strings.common.retry}
              onAction={fetchWallets}
            />
          ) : wallets.length === 0 ? (
            <EmptyState
              icon="wallet-outline"
              title={Strings.wallets.emptyWallets}
              actionTitle={Strings.wallets.addFirstWallet}
              onAction={handleOpenAdd}
            />
          ) : (
            <View style={styles.walletsList}>
              {wallets.map((wallet) => {
                const numericBalance = Number(wallet.balance) || 0;

                return (
                  <View
                    key={wallet.id}
                    style={[
                      styles.walletItemCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      Shadows.card,
                    ]}
                  >
                    <View style={styles.walletItemHeader}>
                      <View style={styles.walletItemTypeCol}>
                        <View
                          style={[
                            styles.walletTypeIconBox,
                            { backgroundColor: theme.primaryMuted },
                          ]}
                        >
                          <Ionicons
                            name={getWalletIcon(wallet.type)}
                            size={20}
                            color={theme.primary}
                          />
                        </View>
                        <View style={styles.walletItemDetails}>
                          <Text
                            style={[
                              Typography.headline,
                              styles.walletItemName,
                              { color: theme.textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            {wallet.name}
                          </Text>
                          <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                            {Strings.dashboard.accountTypeSuffix(wallet.type)}
                          </Text>
                        </View>
                      </View>

                      {/* Action buttons (Edit & Delete) */}
                      <View style={styles.cardActionsRow}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => handleOpenEdit(wallet)}
                          style={[
                            styles.cardActionButton,
                            { backgroundColor: theme.surfaceSubtle },
                          ]}
                          accessibilityLabel={Strings.common.edit}
                        >
                          <Ionicons name="pencil" size={16} color={theme.textPrimary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          onPress={() => setWalletToDelete(wallet)}
                          style={[
                            styles.cardActionButton,
                            { backgroundColor: `${theme.expense}15` },
                          ]}
                          accessibilityLabel={Strings.common.delete}
                        >
                          <Ionicons name="trash-outline" size={16} color={theme.expense} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Balance row */}
                    <View
                      style={[
                        styles.walletItemBalanceRow,
                        { borderTopColor: theme.borderSubtle },
                      ]}
                    >
                      <Text style={[Typography.caption, { color: theme.textTertiary }]}>
                        {Strings.home.totalBalanceTitle}
                      </Text>
                      <Text
                        style={[
                          Typography.moneyRegular,
                          {
                            color: numericBalance >= 0 ? theme.textPrimary : theme.expense,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {formatCurrency(numericBalance)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Add / Edit Wallet Modal */}
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
                {editingWallet ? Strings.wallets.editWallet : Strings.wallets.addWallet}
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
              {/* Wallet Name Input */}
              <Input
                label={Strings.wallets.walletNameLabel}
                placeholder={Strings.wallets.walletNamePlaceholder}
                value={formName}
                onChangeText={(text) => {
                  setFormName(text);
                  if (formError) setFormError(null);
                }}
                error={formError}
                autoFocus={true}
              />

              {/* Wallet Type Picker */}
              <Text
                style={[
                  Typography.subhead,
                  styles.typeSectionLabel,
                  { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              >
                {Strings.wallets.walletTypeLabel}
              </Text>

              <WalletTypeCard
                type="bank"
                title={Strings.onboarding.walletBankTitle}
                description={Strings.onboarding.walletBankDesc}
                selected={formType === 'bank'}
                onSelect={() => setFormType('bank')}
              />

              <WalletTypeCard
                type="cash"
                title={Strings.onboarding.walletCashTitle}
                description={Strings.onboarding.walletCashDesc}
                selected={formType === 'cash'}
                onSelect={() => setFormType('cash')}
              />

              <WalletTypeCard
                type="card"
                title={Strings.onboarding.walletCardTitle}
                description={Strings.onboarding.walletCardDesc}
                selected={formType === 'card'}
                onSelect={() => setFormType('card')}
              />

              <Text
                style={[
                  Typography.caption,
                  styles.balanceNote,
                  { color: theme.textTertiary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
                ]}
              >
                {Strings.wallets.balanceHelper}
              </Text>

              {/* Action Buttons */}
              <View style={styles.modalActionsRow}>
                <Button
                  title={editingWallet ? Strings.wallets.saveChanges : Strings.wallets.saveWallet}
                  onPress={handleSaveWallet}
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

      {/* Delete Confirmation Modal (HARD TO MISS CASCADING DELETION WARNING) */}
      <Modal
        visible={!!walletToDelete}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setWalletToDelete(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.deleteDialog,
              {
                backgroundColor: theme.surface,
                borderColor: theme.expense,
              },
              Shadows.elevated,
            ]}
          >
            {/* Warning Icon Badge */}
            <View style={[styles.warningIconBadge, { backgroundColor: `${theme.expense}15` }]}>
              <Ionicons name="alert-circle" size={40} color={theme.expense} />
            </View>

            {/* Warning Title */}
            <Text style={[Typography.title2, styles.deleteDialogTitle, { color: theme.expense }]}>
              {Strings.wallets.deleteWalletWarningTitle}
            </Text>

            {/* Warning Body with explicit cascade note */}
            <Text style={[Typography.body, styles.deleteDialogBody, { color: theme.textPrimary }]}>
              {walletToDelete ? Strings.wallets.deleteWalletWarningBody(walletToDelete.name) : ''}
            </Text>

            {deleteError ? (
              <Text style={[Typography.caption, styles.dialogErrorText, { color: theme.expense }]}>
                {deleteError}
              </Text>
            ) : null}

            {/* Confirmation Buttons */}
            <View style={styles.deleteDialogActions}>
              <Button
                title={Strings.wallets.confirmDelete}
                onPress={handleConfirmDelete}
                variant="danger"
                loading={deleting}
              />
              <Button
                title={Strings.common.cancel}
                onPress={() => setWalletToDelete(null)}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  summaryBanner: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
  },
  walletsList: {
    gap: Spacing.md,
  },
  walletItemCard: {
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  walletItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletItemTypeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  walletTypeIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletItemDetails: {
    flex: 1,
  },
  walletItemName: {
    fontWeight: '700',
    marginBottom: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cardActionButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletItemBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
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
  typeSectionLabel: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  balanceNote: {
    marginBottom: Spacing.lg,
    lineHeight: 18,
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
    borderWidth: 2,
    padding: Spacing.xl,
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: 400,
    width: '90%',
  },
  warningIconBadge: {
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
