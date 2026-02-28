import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../hooks/useThemeColor';
import { spacing, typography } from '../theme';
import { AppLogo } from './AppLogo';
import { AppText } from './AppText';

interface AppHeaderProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** 'dark' = black bg, white text. 'light' = white bg, black text. */
  variant?: 'dark' | 'light';
  /** When true, shows "Admin" label next to the logo (12px, 400). */
  showAdminLabel?: boolean;
}

export function AppHeader({ left, right, variant = 'dark', showAdminLabel }: AppHeaderProps) {
  const headerBg = useThemeColor('headerBg');
  const { top } = useSafeAreaInsets();
  const isLight = variant === 'light';
  const bg = isLight ? '#FFFFFF' : headerBg;
  const adminColor = isLight ? '#18181B' : '#FFFFFF';

  return (
    <View style={[styles.header, { backgroundColor: bg, paddingTop: top + 18 }]}>
      <View style={styles.start}>
        {left != null && <View style={styles.slot}>{left}</View>}
        <View style={styles.logoRow}>
          <AppLogo size="md" onDark={!isLight} onLight={isLight} />
          {showAdminLabel && (
            <AppText style={[styles.adminLabel, { color: adminColor }]}>Admin</AppText>
          )}
        </View>
      </View>
      {right != null && <View style={styles.slot}>{right}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  start: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoRow: { flexDirection: 'row', alignItems: 'baseline' },
  adminLabel: { ...typography.xs, fontWeight: typography.weights.regular, marginLeft: spacing.sm },
  slot: { flexDirection: 'row', alignItems: 'center' },
});
