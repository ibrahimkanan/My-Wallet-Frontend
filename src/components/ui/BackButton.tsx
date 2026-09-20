import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import { ThemeColors, Typography, Spacing } from '../../constants/theme';
import { useLanguage } from '../../i18n';

export interface BackButtonProps {
  onPress: () => void;
  title?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function BackButton({
  onPress,
  title,
  disabled = false,
  style,
}: BackButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const { isRTL, strings } = useLanguage();

  const displayTitle = title || strings.common.back;
  // In RTL, "back" points right (→). In LTR, "back" points left (←).
  const arrowSymbol = isRTL ? '→' : '←';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.container,
        { alignSelf: isRTL ? 'flex-end' : 'flex-start' },
        style,
      ]}
    >
      <Text style={[Typography.bodyMedium, styles.text, { color: theme.primary }]}>
        {isRTL ? `${displayTitle} ${arrowSymbol}` : `${arrowSymbol} ${displayTitle}`}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
});
