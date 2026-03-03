import React from 'react';
import { StyleSheet } from 'react-native';
import { PrimaryButton, spacing, radii, typography, useThemeColor } from '@shared/ui-kit';

interface AddAnotherActivityButtonProps {
  onPress?: () => void;
}

export function AddAnotherActivityButton({ onPress }: AddAnotherActivityButtonProps) {
  const textColor = useThemeColor('text');

  return (
    <PrimaryButton
      label="Add Another Activity"
      variant="outline"
      onPress={onPress}
      style={styles.button}
      labelStyle={[styles.label, { color: textColor }]}
    />
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    ...typography.xs,
    lineHeight: 16,
    fontWeight: '500',
  },
});

