import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  useColorScheme,
  I18nManager,
  ViewStyle,
} from 'react-native';
import { ThemeColors, Typography, Spacing } from '../../constants/theme';
import { Strings } from '../../constants/strings';

export interface BackButtonProps {
  onPress: () => void;
  title?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export function BackButton({
  onPress,
  title = Strings.common.back,
  disabled = false,
  style,
}: BackButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  // In RTL, "back" points right (→). In LTR, "back" points left (←).
  const arrowSymbol = I18nManager.isRTL ? '→' : '←';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, style]}
    >
      <Text style={[Typography.bodyMedium, styles.text, { color: theme.primary }]}>
        {arrowSymbol} {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  text: {
    fontWeight: '600',
  },
});
