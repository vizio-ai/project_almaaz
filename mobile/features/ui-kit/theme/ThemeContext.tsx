import React, { createContext, useContext, type ReactNode } from 'react';
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radii } from './radii';
import { elevatedCard } from './shadows';
import type { ColorScheme } from './colors';

interface ThemeContextValue {
  scheme: ColorScheme;
  colors: typeof colors.light;
  typography: typeof typography;
  spacing: typeof spacing;
  radii: typeof radii;
  elevatedCard: typeof elevatedCard;
}

const defaultValue: ThemeContextValue = {
  scheme: 'light',
  colors: colors.light,
  typography,
  spacing,
  radii,
  elevatedCard,
};

const ThemeContext = createContext<ThemeContextValue>(defaultValue);

/**
 * Provides theme tokens to the component tree.
 * Dark theme is not fully designed yet — scheme is locked to 'light'.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={defaultValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Returns the current theme: colors, typography, spacing, radii and shadow tokens.
 *
 * Usage:
 *   const { colors, spacing, typography, radii } = useTheme();
 */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
