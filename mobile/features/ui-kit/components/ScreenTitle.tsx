import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { AppText } from './AppText';
import { typography, spacing } from '../theme';

interface ScreenTitleProps {
  text: string;
}

export function ScreenTitle({ text }: ScreenTitleProps) {
  const textColor = useThemeColor('mainText');
  return <AppText style={[styles.title, { color: textColor }]}>{text}</AppText>;
}

const styles = StyleSheet.create({
  title: {
    ...typography['2xl'],
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
});
