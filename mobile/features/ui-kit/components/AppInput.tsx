import React from 'react';
import { View, TextInput, StyleSheet, type TextInputProps, type ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, radii, spacing } from '../theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface AppInputProps extends TextInputProps {
  label?: string;
  /** When true, shows "(Optional)" next to the label in gray */
  optional?: boolean;
  /** Icon shown inside the input, before the text/hint (e.g. 'person-outline', 'mail-outline') */
  leftIcon?: IoniconsName;
  /** When true, shows red border for validation error */
  hasError?: boolean;
}

export function AppInput({ label, optional, leftIcon, style, hasError = false, ...rest }: AppInputProps) {
  const textColor = useThemeColor('text');
  const borderColor = useThemeColor(hasError ? 'error' : 'border');
  const inputBg = useThemeColor('background');
  const labelColor = useThemeColor('text');
  const placeholderColor = useThemeColor('subText');

  return (
    <View style={style as ViewStyle}>
      {label ? (
        <View style={styles.labelRow}>
          <AppText style={[styles.label, { color: labelColor }]}>{label}</AppText>
          {optional && (
            <AppText style={[styles.optionalText, { color: placeholderColor }]}>(Optional)</AppText>
          )}
        </View>
      ) : null}
      <View style={[styles.inputWrap, { borderColor, backgroundColor: inputBg }]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={12} color={placeholderColor} style={styles.inputIcon} />
        )}
        <TextInput
          style={[styles.input, { color: textColor }]}
          placeholderTextColor={placeholderColor}
          {...rest}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
  },
  optionalText: {
    ...typography.sm,
    fontWeight: typography.weights.regular,
    marginLeft: spacing.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    height: 36,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    ...typography.sm,
    fontWeight: typography.weights.regular,
  },
});
