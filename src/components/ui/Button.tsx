import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  useColorScheme,
  View,
} from 'react-native';
import { ThemeColors, Typography, Radii, Spacing, Shadows } from '../../constants/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const isInteractive = !disabled && !loading;

  // Variant-specific styles
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: theme.surfaceSubtle,
          borderWidth: 1,
          borderColor: theme.border,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: theme.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'primary':
      default:
        return {
          backgroundColor: theme.primary,
          ...Shadows.card,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) return theme.textTertiary;
    switch (variant) {
      case 'secondary':
        return theme.textPrimary;
      case 'outline':
        return theme.primary;
      case 'ghost':
        return theme.primary;
      case 'primary':
      default:
        return theme.textInverse;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      disabled={!isInteractive}
      style={[
        styles.base,
        getContainerStyle(),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <Text style={[Typography.bodyMedium, styles.label, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: Radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
