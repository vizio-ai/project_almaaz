import { useTheme } from '../theme/ThemeContext';
import type { ColorToken } from '../theme';

export function useThemeColor(
  colorToken: ColorToken,
  overrides?: { light?: string; dark?: string },
): string {
  const { scheme, colors } = useTheme();

  if (overrides?.light && scheme === 'light') return overrides.light;
  if (overrides?.dark && scheme === 'dark') return overrides.dark;

  return colors[colorToken];
}
