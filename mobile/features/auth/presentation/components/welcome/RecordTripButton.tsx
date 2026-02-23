import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { AppText, useThemeColor } from '@shared/ui-kit';

interface RecordTripButtonProps {
  onPress?: () => void;
}

export function RecordTripButton({ onPress }: RecordTripButtonProps) {
  const accent = useThemeColor('accent');

  return (
    <TouchableOpacity style={[styles.btn, { borderColor: accent }]} onPress={onPress} activeOpacity={0.85}>
      <AppText style={styles.label}>Record a past trip  →</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#000000',
    borderRadius: 22,
    borderWidth: 1,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
