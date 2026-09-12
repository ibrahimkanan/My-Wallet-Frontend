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

export interface WalletTypeCardProps {
  type: WalletType;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

export function WalletTypeCard({
  type,
  title,
  description,
  selected,
  onSelect,
}: WalletTypeCardProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

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
      style={[
        styles.card,
        Shadows.card,
        {
          backgroundColor: selected ? theme.surfaceElevated : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
        },
      ]}
    >
      <View style={styles.leftRow}>
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
              { color: selected ? theme.textBrand : theme.textPrimary },
            ]}
          >
            {title}
          </Text>
          <Text style={[Typography.footnote, { color: theme.textSecondary }]}>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    marginBottom: Spacing.md,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
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
