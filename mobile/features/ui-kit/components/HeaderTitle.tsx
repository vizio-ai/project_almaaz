import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, spacing } from '../theme';

export interface HeaderTitleProps {
  /** Title text shown in the header left slot. */
  title: string;
  /** When provided, a back chevron is rendered to the left of the title. */
  onBack?: () => void;
}

export function HeaderTitle({ title, onBack }: HeaderTitleProps) {
  const textColor = useThemeColor('text');

  return (
    <View style={styles.row}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={8} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={textColor} />
        </TouchableOpacity>
      )}
      <AppText style={[styles.title, { color: textColor }]}>{title}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backBtn: {
    padding: spacing.xs,
  },
  title: {
    ...typography['lg'],
    fontWeight: typography.weights.semibold,
  },
});
