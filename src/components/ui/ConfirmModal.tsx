import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  useColorScheme,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { Strings } from '../../constants/strings';
import { Button } from './Button';

export interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = Strings.common.cancel,
  variant = 'danger',
  icon = 'alert-circle',
  loading = false,
  error = null,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const isDanger = variant === 'danger';
  const accentColor = isDanger ? theme.expense : theme.primary;
  const defaultConfirmLabel = isDanger ? Strings.common.delete : Strings.common.confirm;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.modalBackdrop }]}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: theme.surface,
              borderColor: accentColor,
            },
            Shadows.elevated,
          ]}
        >
          {/* Warning Icon Badge */}
          <View style={[styles.iconBadge, { backgroundColor: `${accentColor}18` }]}>
            <Ionicons name={icon} size={36} color={accentColor} />
          </View>

          {/* Title */}
          <Text
            style={[
              Typography.title2,
              styles.title,
              { color: isDanger ? theme.expense : theme.textPrimary },
            ]}
          >
            {title}
          </Text>

          {/* Body Message */}
          <Text
            style={[
              Typography.body,
              styles.message,
              { color: theme.textSecondary, textAlign: 'center' },
            ]}
          >
            {message}
          </Text>

          {/* Error Message if any */}
          {error ? (
            <Text style={[Typography.caption, styles.errorText, { color: theme.expense }]}>
              {error}
            </Text>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title={confirmLabel || defaultConfirmLabel}
              onPress={onConfirm}
              variant={variant}
              loading={loading}
            />
            <Button
              title={cancelLabel}
              onPress={onCancel}
              variant="secondary"
              disabled={loading}
              style={{ marginTop: Spacing.sm }}
            />
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
    padding: Spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radii.xxl,
    borderWidth: 1.5,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  errorText: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
  },
});
