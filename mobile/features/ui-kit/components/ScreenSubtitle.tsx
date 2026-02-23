import React from 'react';
import { StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';

interface ScreenSubtitleProps {
  text: string;
}

export function ScreenSubtitle({ text }: ScreenSubtitleProps) {
  const secondaryText = useThemeColor('subText');
  return <AppText style={[styles.subtitle, { color: secondaryText }]}>{text}</AppText>;
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 20,
  },
});
