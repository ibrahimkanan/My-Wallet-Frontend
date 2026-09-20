import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';

export interface SettingRowProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  onPress?: () => void;
}

export function SettingRow({
  title,
  subtitle,
  icon,
  iconColor,
  iconBg,
  onPress,
}: SettingRowProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const color = iconColor || theme.primary;
  const bg = iconBg || theme.primaryMuted;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
        Shadows.card,
      ]}
    >
      <View style={styles.cardLeft}>
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.textCol}>
          <Text
            style={[
              Typography.subhead,
              styles.title,
              { color: theme.textPrimary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                Typography.caption,
                { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={theme.textTertiary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    paddingEnd: Spacing.sm,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
    marginBottom: 2,
  },
});
