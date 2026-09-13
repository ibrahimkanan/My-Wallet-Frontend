import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ViewStyle,
  I18nManager,
} from 'react-native';
import { ThemeColors, Typography, Radii, Spacing } from '../../constants/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  helperText?: string;
  containerStyle?: ViewStyle;
  prefix?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  containerStyle,
  prefix,
  secureTextEntry,
  ...rest
}: InputProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isSecured = secureTextEntry && !isPasswordVisible;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text
          style={[
            Typography.subhead,
            styles.label,
            { color: theme.textSecondary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface,
            borderColor: error
              ? theme.expense
              : isFocused
              ? theme.borderFocus
              : theme.border,
          },
        ]}
      >
        {prefix ? <View style={styles.prefixContainer}>{prefix}</View> : null}

        <TextInput
          {...rest}
          placeholderTextColor={theme.textTertiary}
          secureTextEntry={isSecured}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            Typography.body,
            styles.input,
            {
              color: theme.textPrimary,
              textAlign: I18nManager.isRTL ? 'right' : 'left',
              writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
            },
            rest.style,
          ]}
        />

        {secureTextEntry ? (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.toggleButton}
            onPress={() => setIsPasswordVisible((prev) => !prev)}
          >
            <Text style={[Typography.caption, { color: theme.primary, fontWeight: '600' }]}>
              {isPasswordVisible ? 'إخفاء' : 'إظهار'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <Text
          style={[
            Typography.caption,
            styles.errorText,
            { color: theme.expense, textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            Typography.caption,
            styles.helperText,
            { color: theme.textTertiary, textAlign: I18nManager.isRTL ? 'right' : 'left' },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  inputContainer: {
    height: 52,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
  },
  prefixContainer: {
    marginEnd: Spacing.sm,
  },
  toggleButton: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    marginStart: Spacing.xs,
  },
  errorText: {
    marginTop: Spacing.xs,
    marginHorizontal: Spacing.xs,
    fontWeight: '500',
  },
  helperText: {
    marginTop: Spacing.xs,
    marginHorizontal: Spacing.xs,
  },
});
