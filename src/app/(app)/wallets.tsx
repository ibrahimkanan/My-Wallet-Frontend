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
  WalletListItem,
  WalletFormModal,
} from '../../components';
import api from '../../services/api';
import { Wallet, WalletType } from '../../types/models';
import { GetWalletsResponse } from '../../types/api';
import { getErrorMessage } from '../../utils/errors';
import { formatCurrency } from '../../utils/formatters';

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

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWallets();
  };

  const handleOpenAdd = () => {
    setEditingWallet(null);
    setFormName('');
    setFormType('bank');
    setFormError(null);
    setIsFormVisible(true);
  };

  const handleOpenEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setFormName(wallet.name);
    setFormType(wallet.type);
    setFormError(null);
    setIsFormVisible(true);
  };

  const handleSaveWallet = async () => {
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError(Strings.wallets.nameRequired);
      return;
    }

    const isDuplicate = wallets.some((w) => {
      if (editingWallet && w.id === editingWallet.id) return false;
      return w.name.trim().toLowerCase() === trimmed.toLowerCase();
    });

    if (isDuplicate) {
      setFormError('اسم المحفظة مسجل مسبقاً، يرجى اختيار اسم آخر.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (editingWallet) {
        await api.patch(`/wallets/${editingWallet.id}`, {
          name: trimmed,
          type: formType,
        });
      } else {
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

  const handleConfirmDelete = async () => {
    if (!walletToDelete) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await api.delete(`/wallets/${walletToDelete.id}`);
      setWalletToDelete(null);
      fetchWallets();
    } catch (err: unknown) {
      setDeleteError(getErrorMessage(err, Strings.common.errorOccurred));
    } finally {
      setDeleting(false);
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
                <Text style={[Typography.caption, { color: theme.textSecondary }]}>
                  {Strings.wallets.totalBalanceLabel}
                </Text>
                <Text
                  style={[
                    Typography.title1,
                    styles.totalBalanceText,
                    {
                      color: totalBalance >= 0 ? theme.primary : theme.expense,
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
              {wallets.map((wallet) => (
                <WalletListItem
                  key={wallet.id}
                  wallet={wallet}
                  onEdit={() => handleOpenEdit(wallet)}
                  onDelete={() => {
                    setDeleteError(null);
                    setWalletToDelete(wallet);
                  }}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Add / Edit Wallet Modal */}
      <WalletFormModal
        visible={isFormVisible}
        editingWallet={editingWallet}
        formName={formName}
        onChangeName={(text) => {
          setFormName(text);
          if (formError) setFormError(null);
        }}
        formType={formType}
        onChangeType={setFormType}
        formError={formError}
        submitting={submitting}
        onSubmit={handleSaveWallet}
        onClose={() => setIsFormVisible(false)}
      />

      {/* Delete Confirmation Modal (Hard to miss cascading deletion warning) */}
      <ConfirmModal
        visible={Boolean(walletToDelete)}
        title={Strings.wallets.deleteWalletWarningTitle}
        message={walletToDelete ? Strings.wallets.deleteWalletWarningBody(walletToDelete.name) : ''}
        confirmLabel={Strings.wallets.confirmDelete}
        loading={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => setWalletToDelete(null)}
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  summaryBanner: {
    borderRadius: Radii.xxl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalBalanceText: {
    fontWeight: '800',
    marginTop: 4,
  },
  walletCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    gap: 6,
  },
  walletsList: {
    gap: Spacing.xs,
  },
});
