/**
 * Border radius scale — use instead of hardcoding borderRadius.
 *
 * Usage:
 *   inputWrap: { borderRadius: radii.sm }
 *   button:    { borderRadius: radii.full }
 *   card:      { borderRadius: radii.lg }
 */
export const radii = {
  sm:      6,
  md:      8,
  rounded: 10,
  lg:      12,
  xl:      16,
  full:    999,
} as const;
