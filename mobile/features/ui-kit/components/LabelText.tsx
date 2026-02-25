import React from 'react';
import { StyleSheet, type TextStyle } from 'react-native';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography } from '../theme';

interface LabelTextProps {
  children: React.ReactNode;
  style?: TextStyle;
}

/**
 * Form field label text. Uses theme text color and consistent label styling.
 */
export function LabelText({ children, style }: LabelTextProps) {
  const textColor = useThemeColor('labelText');
  return (
    <AppText style={[styles.label, { color: textColor }, style]}>
      {children}
    </AppText>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
    marginBottom: 6,
  },
});
