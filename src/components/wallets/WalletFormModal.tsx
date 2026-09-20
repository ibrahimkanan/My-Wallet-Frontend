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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii } from '../../constants/theme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { WalletTypeCard } from '../ui/WalletTypeCard';
import { Wallet, WalletType } from '../../types/models';
import { useLanguage } from '../../i18n';

interface WalletFormModalProps {
  visible: boolean;
  editingWallet: Wallet | null;
  formName: string;
  onChangeName: (text: string) => void;
  formType: WalletType;
  onChangeType: (type: WalletType) => void;
  formError: string | null;
  submitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export function WalletFormModal({
  visible,
  editingWallet,
  formName,
  onChangeName,
  formType,
  onChangeType,
  formError,
  submitting,
  onSubmit,
  onClose,
}: WalletFormModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { isRTL, strings } = useLanguage();

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
              {editingWallet ? strings.wallets.editWallet : strings.wallets.addWallet}
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
            {/* Wallet Name Input */}
            <Input
              label={strings.wallets.walletNameLabel}
              placeholder={strings.wallets.walletNamePlaceholder}
              value={formName}
              onChangeText={onChangeName}
              error={formError}
              autoFocus={true}
            />

            {/* Wallet Type Picker */}
            <Text
              style={[
                Typography.subhead,
                styles.typeSectionLabel,
                { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {strings.wallets.walletTypeLabel}
            </Text>

            <WalletTypeCard
              type="bank"
              title={strings.onboarding.walletBankTitle}
              description={strings.onboarding.walletBankDesc}
              selected={formType === 'bank'}
              onSelect={() => onChangeType('bank')}
              disabled={submitting}
            />

            <WalletTypeCard
              type="cash"
              title={strings.onboarding.walletCashTitle}
              description={strings.onboarding.walletCashDesc}
              selected={formType === 'cash'}
              onSelect={() => onChangeType('cash')}
              disabled={submitting}
            />

            <WalletTypeCard
              type="card"
              title={strings.onboarding.walletCardTitle}
              description={strings.onboarding.walletCardDesc}
              selected={formType === 'card'}
              onSelect={() => onChangeType('card')}
              disabled={submitting}
            />

            <Text
              style={[
                Typography.caption,
                styles.balanceNote,
                { color: theme.textTertiary, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {strings.wallets.balanceHelper}
            </Text>

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <Button
                title={editingWallet ? strings.wallets.saveChanges : strings.wallets.saveWallet}
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
  typeSectionLabel: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  balanceNote: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  modalActionsRow: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalSubmitButton: {
    marginBottom: Spacing.xs,
  },
});
