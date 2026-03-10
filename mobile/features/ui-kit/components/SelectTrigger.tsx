import React, { type ComponentProps } from 'react';
import { TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, spacing, radii } from '../theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export interface SelectTriggerProps {
  /** Optional label rendered above the trigger */
  label?: string;
  value?: string;
  placeholder?: string;
  onPress?: () => void;
  /** Style applied to the outer container (includes label when present) */
  style?: ViewStyle;
  /** Ionicons icon shown on the left inside the trigger */
  leftIcon?: IoniconsName;
  /** Set true to hide the default right chevron */
  hideRightChevron?: boolean;
  disabled?: boolean;
  /** When true, shows red border for validation error */
  hasError?: boolean;
}

export function SelectTrigger({
  label,
  value,
  placeholder = 'Select...',
  onPress,
  style,
  leftIcon,
  hideRightChevron = false,
  disabled,
  hasError = false,
}: SelectTriggerProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const errorColor = useThemeColor('error');
  const background = useThemeColor('background');

  const hasValue = !!value?.trim();

  return (
    <TouchableOpacity
      style={[styles.trigger, { borderColor: hasError ? errorColor : border, backgroundColor: background }, style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {leftIcon && (
        <Ionicons name={leftIcon} size={16} color={secondary} style={styles.leftIcon} />
      )}
      <AppText
        style={[styles.text, { color: hasValue ? textColor : secondary }]}
        numberOfLines={1}
      >
        {hasValue ? value : placeholder}
      </AppText>
      {!hideRightChevron && (
        <Ionicons name="chevron-down" size={16} color={secondary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    height: 36,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  text: {
    flex: 1,
    ...typography.sm,
  },
});
