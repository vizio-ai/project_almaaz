import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, spacing } from '../theme';

const TEXT_ON_ERROR = '#FFFFFF';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  horizontalInset?: number;
}

export function ErrorBanner({ message, onDismiss, horizontalInset = 24 }: ErrorBannerProps) {
  const errorColor = useThemeColor('error');

  const content = (
    <AppText style={[styles.text, { color: TEXT_ON_ERROR }]}>{message}</AppText>
  );

  const bannerStyle = [
    styles.banner,
    { backgroundColor: errorColor, marginHorizontal: -horizontalInset },
  ];

  if (onDismiss) {
    return (
      <TouchableOpacity style={bannerStyle} onPress={onDismiss} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={bannerStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  text: {
    ...typography.sm,
    lineHeight: 20,
  },
});
