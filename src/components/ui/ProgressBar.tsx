import React from 'react';
import { View, StyleSheet, useColorScheme, ViewStyle, StyleProp } from 'react-native';
import { ThemeColors, Radii } from '../../constants/theme';

export interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  trackColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  color,
  trackColor,
  height = 8,
  style,
}: ProgressBarProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? ThemeColors.dark : ThemeColors.light;

  const clamped = Math.min(Math.max(progress, 0), 1);
  const fillColor = color || theme.primary;
  const bgTrack = trackColor || theme.borderSubtle;

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: bgTrack,
          borderRadius: Radii.full,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped * 100}%`,
            backgroundColor: fillColor,
            borderRadius: Radii.full,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
