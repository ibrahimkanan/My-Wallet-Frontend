import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Typography, Spacing, Radii, Shadows } from '../../constants/theme';
import { useLanguage } from '../../i18n';

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
  const { isRTL } = useLanguage();

  const color = iconColor || theme.primary;
  const bg = iconBg || theme.primaryMuted;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
        Shadows.card,
      ]}
    >
      <View
        style={[
          styles.cardLeft,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: bg }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.textCol}>
          <Text
            style={[
              Typography.subhead,
              styles.title,
              { color: theme.textPrimary, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                Typography.caption,
                { color: theme.textSecondary, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <Ionicons
        name={isRTL ? 'chevron-back' : 'chevron-forward'}
        size={20}
        color={theme.textTertiary}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardLeft: {
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
