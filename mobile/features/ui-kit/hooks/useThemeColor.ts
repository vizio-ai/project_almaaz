import { colors, ColorToken } from '../theme';

export function useThemeColor(
  colorToken: ColorToken,
  overrides?: { light?: string; dark?: string },
): string {
  const scheme = 'light' as const;

  if (overrides?.light) return overrides.light;

  return colors[scheme][colorToken];
}
