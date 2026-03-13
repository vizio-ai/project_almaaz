import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { DEFAULT_FONT_FAMILY } from '../theme/typography';

/**
 * Text component with default fontFamily and capped font scaling.
 *
 * maxFontSizeMultiplier=1.3 allows modest accessibility enlargement (up to 30%)
 * without breaking fixed-height cards or single-line truncation layouts.
 * Override per-instance when a larger scale is acceptable (e.g. body paragraphs).
 */
export function AppText({ style, maxFontSizeMultiplier = 1.3, ...rest }: TextProps) {
  return (
    <RNText
      style={[styles.default, style]}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontFamily: DEFAULT_FONT_FAMILY,
  },
});
