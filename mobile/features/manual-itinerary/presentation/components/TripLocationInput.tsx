import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor, typography, spacing } from '@shared/ui-kit';

interface TripLocationInputProps {
  value: string;
  /** When undefined the field is display-only. */
  onChange?: (text: string) => void;
  /** When set, location icon is tappable and opens the map picker (call from parent). */
  onLocationIconPress?: () => void;
}

export function TripLocationInput({ value, onChange, onLocationIconPress }: TripLocationInputProps) {
  const secondary = useThemeColor('textSecondary');
  const textColor = useThemeColor('text');

  const icon = (
    <Ionicons name="location-outline" size={14} color={secondary} />
  );

  return (
    <View style={styles.row}>
      {onLocationIconPress ? (
        <TouchableOpacity onPress={onLocationIconPress} hitSlop={8}>
          {icon}
        </TouchableOpacity>
      ) : (
        icon
      )}
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
        <AppText
          style={[styles.text, { color: secondary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
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
