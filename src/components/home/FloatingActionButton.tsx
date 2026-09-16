import React from 'react';
import { StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors, Spacing, Radii, Shadows, BrandColors } from '../../constants/theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

export function FloatingActionButton({
  onPress,
  accessibilityLabel = 'إضافة معاملة جديدة',
}: FloatingActionButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[
        styles.fab,
        {
          backgroundColor: theme.primary,
        },
        Shadows.elevated,
      ]}
    >
      <View style={styles.inner}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    elevation: 8,
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
