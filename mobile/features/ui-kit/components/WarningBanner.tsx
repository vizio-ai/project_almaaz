import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { typography, radii, spacing, colors } from '../theme';

const WARNING_BORDER = colors.light.danger;
const WARNING_BG = colors.light.warningBg;

interface WarningBannerProps {
  message: string;
  onDismiss: () => void;
}

export function WarningBanner({ message, onDismiss }: WarningBannerProps) {
  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: WARNING_BG, borderColor: WARNING_BORDER }]}
      onPress={onDismiss}
      activeOpacity={0.8}
    >
      <Ionicons
        name="alert-circle-outline"
        size={20}
        color={WARNING_BORDER}
        style={styles.icon}
      />
      <AppText style={[styles.text, { color: WARNING_BORDER }]}>{message}</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  icon: {
    marginRight: 10,
  },
  text: {
    flex: 1,
    ...typography.sm,
    fontWeight: typography.weights.regular,
    lineHeight: 20,
  },
});
