/** Default font family for all text. Override with style when needed. */
export const DEFAULT_FONT_FAMILY = 'font-sans';

/**
 * Typography scale — use instead of hardcoding fontSize.
 *
 * lineHeight is intentionally omitted: it is a fixed pixel value and does not
 * scale with the system font size setting, which causes text overflow on
 * accessibility-enlarged fonts. Let the OS handle line spacing by default;
 * add lineHeight manually only when a specific layout constraint requires it.
 *
 * Usage:
 *   label: { ...typography.sm, fontWeight: typography.weights.medium }
 */
export const typography = {
  xs:       { fontSize: 12 },
  caption:  { fontSize: 13 },
  sm:       { fontSize: 14 },
  base:     { fontSize: 16 },
  lg:       { fontSize: 18 },
  xl:       { fontSize: 20 },
  featured: { fontSize: 22 },
  '2xl':    { fontSize: 24 },
  '3xl':    { fontSize: 28 },
  '4xl':    { fontSize: 36 },

  weights: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },
} as const;
