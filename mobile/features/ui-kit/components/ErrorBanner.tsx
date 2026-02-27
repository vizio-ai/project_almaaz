import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, radii, spacing } from '../theme';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;

}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const errorColor = useThemeColor('error');
  const errorBg = useThemeColor('warningBg');

  const bannerStyle = [
    styles.banner,
    { backgroundColor: errorBg, borderColor: errorColor },
  ];

  const content = (
    <>
      <Ionicons name="alert-circle-outline" size={20} color={errorColor} style={styles.icon} />
      <AppText style={[styles.text, { color: errorColor }]}>{message}</AppText>
    </>
  );

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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: 24,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    ...typography.sm,
    fontWeight: typography.weights.regular,
    lineHeight: 20,
  },
});
