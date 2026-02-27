import React from 'react';
import { StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography } from '../theme';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  onDark?: boolean;
  onLight?: boolean;
}

const fontSizes = { sm: 18, md: 22, lg: 28 } as const;

export function AppLogo({ size = 'md', onDark, onLight }: AppLogoProps) {
  const textColor = useThemeColor('text');
  const accentColor = useThemeColor('accent');
  const fontSize = fontSizes[size];
  const logoColor = onDark ? '#FFFFFF' : onLight ? '#18181B' : textColor;

  return (
    <AppText style={[styles.logo, { color: logoColor }]}>
      dora<AppText style={{ color: accentColor }}>.</AppText>
    </AppText>
  );
}

const styles = StyleSheet.create({
  logo: {
    ...typography['3xl'],
    fontWeight: typography.weights.semibold,
  },
});
