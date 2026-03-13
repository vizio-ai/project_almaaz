import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor, typography, spacing, radii } from '@shared/ui-kit';
import { AuthStrings } from '../constants/strings';

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isValid?: boolean;
  hasError?: boolean;
}

export function PhoneInput({ value, onChangeText, onSubmit, isValid = false, hasError = false }: PhoneInputProps) {
  const textColor = useThemeColor('text');
  const placeholderColor = useThemeColor('placeholder');
  const themeBorder = useThemeColor('border');
  const dangerColor = useThemeColor('danger');
  const successColor = useThemeColor('success');
  const borderColor = hasError ? dangerColor : themeBorder;

  return (
    <View style={[styles.wrapper, { borderColor }]}>
      <TextInput
        style={[styles.input, { color: textColor }, isValid && styles.inputWithIcon]}
        value={value}
        onChangeText={onChangeText}
        keyboardType="phone-pad"
        placeholder={AuthStrings.phoneEntry.phonePlaceholder}
        placeholderTextColor={placeholderColor}
        onSubmitEditing={onSubmit}
      />
      {isValid && (
        <View style={styles.iconWrap} pointerEvents="none">
          <Ionicons name="checkmark" size={22} color={successColor} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: spacing.xs,
    paddingRight: 0,
    ...typography.sm,
  },
  inputWithIcon: {
    paddingRight: spacing.sm,
  },
  iconWrap: {
    marginLeft: spacing.xs,
  },
});
