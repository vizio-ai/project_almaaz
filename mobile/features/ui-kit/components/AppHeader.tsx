import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { spacing, typography } from '../theme';
import { AppLogo } from './AppLogo';
import { AppText } from './AppText';

const WIZARD_ACCENT = '#44ffff';

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

  if (isWizard) {
    return (
      <View style={[styles.wizardHeader, { paddingTop: top }]}>
        <View style={styles.wizardRow}>
          {onBack != null && (
            <TouchableOpacity
              style={styles.wizardBackButton}
              onPress={onBack}
              activeOpacity={0.8}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.wizardTitle}>
            <Text style={styles.wizardTitleMain}>dora</Text>
            <Text style={styles.wizardTitleDot}>.</Text>
          </Text>
        </View>
      </View>
    );
  }

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
  // Wizard variant (Figma Frame107)
  wizardHeader: {
    width: '100%',
    backgroundColor: '#0a0a0a',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: WIZARD_ACCENT,
    paddingBottom: 16,
    gap: 18,
    alignItems: 'center',
  },
  wizardRow: {
    width: '100%',
    maxWidth: 382,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.xl,
  },
  wizardBackButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wizardTitle: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'left',
  },
  wizardTitleMain: {
    color: '#fff',
  },
  wizardTitleDot: {
    color: WIZARD_ACCENT,
  },
});
