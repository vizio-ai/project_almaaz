import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { AppText, useThemeColor } from '@shared/ui-kit';

interface LoginButtonProps {
  onPress: () => void;
}

export function LoginButton({ onPress }: LoginButtonProps) {
  const accent = useThemeColor('accent');

  return (
    <TouchableOpacity style={[styles.btn, { borderColor: accent }]} onPress={onPress} activeOpacity={0.8}>
      <AppText style={styles.label}>Login / Sign Up</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: { fontSize: 13, fontWeight: '500', color: '#FFFFFF' },
});
