import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor, typography, spacing } from '@shared/ui-kit';

interface TripLocationInputProps {
  value: string;
  /** When undefined the field is display-only. */
  onChange?: (text: string) => void;
}

export function TripLocationInput({ value, onChange }: TripLocationInputProps) {
  const secondary = useThemeColor('textSecondary');
  const textColor = useThemeColor('text');

  return (
    <View style={styles.row}>
      <Ionicons name="location-outline" size={14} color={secondary} />
      {onChange ? (
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholder="Destination"
          placeholderTextColor={secondary}
          value={value}
          onChangeText={onChange}
          returnKeyType="done"
        />
      ) : (
        <AppText style={[styles.text, { color: secondary }]} numberOfLines={1}>
          {value || '—'}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  input: {
    ...typography.sm,
    flex: 1,
    padding: 0,
  },
  text: {
    ...typography.sm,
    flex: 1,
  },
});
