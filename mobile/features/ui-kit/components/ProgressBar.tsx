import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';

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
    borderRadius: 999,
    marginBottom: 24,
    marginTop: 24,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
