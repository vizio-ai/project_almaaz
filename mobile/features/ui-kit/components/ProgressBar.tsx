import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { radii, spacing } from '../theme';

interface ProgressBarProps {
  step: number;
  total: number;
}

export function ProgressBar({ step, total }: ProgressBarProps) {
  const activeColor = useThemeColor('text');
  const inactiveColor = useThemeColor('border');

  const progress = total > 0 ? Math.min(step / total, 1) : 0;

  return (
    <View style={[styles.track, { backgroundColor: inactiveColor }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: activeColor,
            width: `${progress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radii.full,
    marginBottom: spacing['2xl'],
    marginTop: spacing['2xl'],
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
