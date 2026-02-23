import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
  horizontalInset?: number;
}

export function ErrorBanner({ message, onDismiss, horizontalInset = 24 }: ErrorBannerProps) {
  const errorColor = useThemeColor('error');

  const content = (
    <AppText style={styles.text}>{message}</AppText>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
});
