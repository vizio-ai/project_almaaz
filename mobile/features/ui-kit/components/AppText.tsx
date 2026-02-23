import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { DEFAULT_FONT_FAMILY } from '../theme/typography';

/**
 * Text component with default fontFamily. Use for all text unless a different font is needed.
 * Override with style={{ fontFamily: 'font-serif' }} when needed.
 */
export function AppText({ style, ...rest }: TextProps) {
  return (
    <RNText
      style={[styles.default, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: DEFAULT_FONT_FAMILY,
  },
});
