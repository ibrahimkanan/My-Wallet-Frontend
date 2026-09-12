import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  useColorScheme,
} from 'react-native';
import { ThemeColors, Typography, Radii, Spacing } from '../../constants/theme';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
  onComplete?: (code: string) => void;
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  onComplete,
}: OtpInputProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;
  const inputRef = useRef<TextInput>(null);

  const handleTextChange = (text: string) => {
    // Only accept numeric digits up to specified length
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(cleaned);
    if (cleaned.length === length) {
      onComplete?.(cleaned);
    }
  };

  const focusInput = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const digits = Array.from({ length }, (_, i) => value[i] || '');

  return (
    <Pressable onPress={focusInput} style={styles.container}>
      {/* Hidden real TextInput */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleTextChange}
        maxLength={length}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoFocus
        editable={!disabled}
        style={styles.hiddenInput}
      />

      {/* Styled 6 Digit Boxes */}
      <View style={styles.boxesRow}>
        {digits.map((digit, index) => {
          const isFocused = !disabled && (index === value.length || (index === length - 1 && value.length === length));
          const hasValue = !!digit;

          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  backgroundColor: theme.surface,
                  borderColor: error
                    ? theme.expense
                    : isFocused
                    ? theme.primary
                    : hasValue
                    ? theme.borderFocus
                    : theme.border,
                },
                isFocused && styles.boxFocused,
              ]}
            >
              <Text
                style={[
                  Typography.moneyLarge,
                  styles.digitText,
                  {
                    color: error ? theme.expense : theme.textPrimary,
                  },
                ]}
              >
                {digit}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 340,
    gap: Spacing.sm,
  },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxHeight: 64,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFocused: {
    borderWidth: 2,
    transform: [{ scale: 1.03 }],
  },
  digitText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
});
