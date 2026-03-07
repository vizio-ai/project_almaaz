import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { spacing, typography } from '../theme';
import { AppLogo } from './AppLogo';
import { AppText } from './AppText';

interface AppHeaderProps {
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** 'dark' = black bg, white text. 'light' = white bg, black text. 'wizard' = Figma wizard header (back + dora.). */
  variant?: 'dark' | 'light' | 'wizard';
  /** When true, shows "Admin" label next to the logo (12px, 400). */
  showAdminLabel?: boolean;
  /** For variant="wizard": back button press handler. */
  onBack?: () => void;
}

export function AppHeader({ left, right, variant = 'dark', showAdminLabel, onBack }: AppHeaderProps) {
  const headerBg = useThemeColor('headerBg');
  const { top } = useSafeAreaInsets();
  const isLight = variant === 'light';
  const isWizard = variant === 'wizard';
  const bg = isWizard ? '#0a0a0a' : isLight ? '#FFFFFF' : headerBg;
  const adminColor = isLight ? '#18181B' : '#FFFFFF';

  return (
    <View style={[styles.header, { backgroundColor: bg, paddingTop: top + 18 }]}>
      <View style={styles.start}>
        {isWizard && onBack != null && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.8}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}
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
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
