import React from 'react';
import { StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, spacing } from '../theme';

interface ScreenSubtitleProps {
  text: string;
}

export function ScreenSubtitle({ text }: ScreenSubtitleProps) {
  const secondaryText = useThemeColor('subText');
  return <AppText style={[styles.subtitle, { color: secondaryText }]}>{text}</AppText>;
}

const styles = StyleSheet.create({
  subtitle: {
    ...typography.sm,
    fontWeight: typography.weights.regular,
    marginBottom: spacing.xl,
  },
});
