import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { ThemeColors, Typography, Radii, Spacing, Shadows } from '../../constants/theme';
import { WalletType } from '../../types/models';
import { useLanguage } from '../../i18n';

export interface WalletTypeCardProps {
  type: WalletType;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function WalletTypeCard({
  type,
  title,
  description,
  selected,
  onSelect,
  disabled = false,
}: WalletTypeCardProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { isRTL } = useLanguage();

  const getEmojiIcon = () => {
    switch (type) {
      case 'cash':
        return '💵';
      case 'bank':
        return '🏛️';
      case 'card':
        return '💳';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onSelect}
      disabled={disabled}
      style={[
        styles.card,
        Shadows.card,
        {
          backgroundColor: selected ? theme.surfaceElevated : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}
    >
      <View
        style={[
          styles.leftRow,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: selected ? theme.primaryMuted : theme.surfaceSubtle,
            },
          ]}
        >
          <Text style={styles.iconText}>{getEmojiIcon()}</Text>
        </View>

        <View style={styles.textColumn}>
          <Text
            style={[
              Typography.headline,
              styles.title,
              {
                color: selected ? theme.textBrand : theme.textPrimary,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              Typography.footnote,
              {
                color: theme.textSecondary,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {description}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.radioCircle,
          {
            borderColor: selected ? theme.primary : theme.border,
            backgroundColor: selected ? theme.primary : 'transparent',
          },
        ]}
      >
        {selected ? <View style={styles.innerDot} /> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    marginBottom: Spacing.md,
  },
  leftRow: {
    alignItems: 'center',
    flex: 1,
    paddingEnd: Spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: Spacing.md,
  },
  iconText: {
    fontSize: 22,
  },
  textColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '600',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});
