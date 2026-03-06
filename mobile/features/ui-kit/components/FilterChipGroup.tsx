import React, { type ComponentProps } from 'react';
import { View, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, spacing, radii } from '../theme';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];

export interface FilterChipOption<T extends string = string> {
  value: T;
  label: string;
  /** Optional Ionicons icon shown to the left of the label */
  icon?: IoniconsName;
}

export interface FilterChipGroupProps<T extends string = string> {
  options: FilterChipOption<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  /** When true, pressing the active chip deselects it (calls onChange(null)) */
  allowDeselect?: boolean;
  style?: ViewStyle;
}

export function FilterChipGroup<T extends string = string>({
  options,
  value,
  onChange,
  allowDeselect = false,
  style,
}: FilterChipGroupProps<T>) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');

  return (
    <View style={[styles.row, style]}>
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.chip,
              { borderColor: border },
              isActive && { backgroundColor: textColor, borderColor: textColor },
            ]}
            onPress={() => onChange(allowDeselect && isActive ? null : opt.value)}
            activeOpacity={0.7}
          >
            {opt.icon && (
              <Ionicons
                name={opt.icon}
                size={13}
                color={isActive ? '#FAFAFA' : secondary}
                style={styles.chipIcon}
              />
            )}
            <AppText style={[styles.chipLabel, { color: isActive ? '#FAFAFA' : secondary }]}>
              {opt.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chipIcon: {
    marginRight: 4,
  },
  chipLabel: {
    ...typography.xs,
    fontWeight: '500',
  },
});
