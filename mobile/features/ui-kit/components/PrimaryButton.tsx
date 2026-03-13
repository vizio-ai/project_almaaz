import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
  type TextStyle,
} from 'react-native';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, radii, spacing, colors } from '../theme';

interface PrimaryButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  label: string;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outline';
  /** When true, button keeps primary style when disabled/loading (no gray state) */
  preserveStyle?: boolean;
  style?: TouchableOpacityProps['style'];
  /** Override label text style */
  labelStyle?: TextStyle;
}

export function PrimaryButton({
  label,
  isLoading = false,
  disabled = false,
  variant = 'filled',
  preserveStyle = false,
  style,
  labelStyle,
  onPress,
  ...rest
}: PrimaryButtonProps) {
  const primaryBg = useThemeColor('buttonPrimary');
  const primaryText = useThemeColor('buttonPrimaryText');
  const text = useThemeColor('text');
  const borderColor = useThemeColor('borderColor');

  const isInactive = disabled || isLoading;

  const bgColor = variant === 'filled' ? primaryBg : 'transparent';
  const textColor = variant === 'filled' ? primaryText : text;

  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: bgColor, borderColor }, style]}
      onPress={onPress}
      disabled={isInactive}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isInactive, busy: isLoading }}
      {...rest}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <AppText style={[styles.label, { color: textColor }, labelStyle]}>{label}</AppText>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.full,
    borderWidth: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
    lineHeight: 20,
    includeFontPadding: false,
  },
});
