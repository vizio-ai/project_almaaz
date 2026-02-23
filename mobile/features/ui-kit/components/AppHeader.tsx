import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../hooks/useThemeColor';
import { AppLogo } from './AppLogo';

interface AppHeaderProps {
  right?: React.ReactNode;
  /** 'dark' = black bg, white text. 'light' = white bg, black text. */
  variant?: 'dark' | 'light';
}

export function AppHeader({ right, variant = 'dark' }: AppHeaderProps) {
  const headerBg = useThemeColor('headerBg');
  const { top } = useSafeAreaInsets();
  const isLight = variant === 'light';
  const bg = isLight ? '#FFFFFF' : headerBg;

  return (
    <View style={[styles.header, { backgroundColor: bg, paddingTop: top + 18 }]}>
      <AppLogo size="md" onDark={!isLight} onLight={isLight} />
      {right != null && <View style={styles.right}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  right: { flexDirection: 'row', alignItems: 'center' },
});
