/**
 * Spacing scale (4px base) — use instead of hardcoding padding/margin values.
 *
 * Usage:
 *   paddingHorizontal: spacing.lg    // 16
 *   marginBottom:      spacing.sm    // 8
 *   gap:               spacing.xs    // 4
 */
export const spacing = {
  xs:    4,
  sm:    8,
  md:    12,
  smd:   14,
  lg:    16,
  xl:    20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
} as const;
