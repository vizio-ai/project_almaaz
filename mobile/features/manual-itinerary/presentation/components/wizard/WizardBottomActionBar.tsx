import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PrimaryButton } from '@shared/ui-kit';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WizardBottomActionBarProps {
  /** Left button label (e.g. "Cancel" or "Back"). */
  leftLabel: string;
  onLeftPress: () => void;
  /** Right button label (e.g. "Next" or "Save itinerary"). */
  rightLabel: string;
  onRightPress: () => void;
  /** When true, right button shows loading spinner. */
  rightLoading?: boolean;
  /** When true, right button is disabled. */
  rightDisabled?: boolean;
}

// ─── Component (Figma Frame158) ─────────────────────────────────────────────────

export function WizardBottomActionBar({
  leftLabel,
  onLeftPress,
  rightLabel,
  onRightPress,
  rightLoading = false,
  rightDisabled = false,
}: WizardBottomActionBarProps) {
  return (
    <View style={styles.bottomBar}>
      <PrimaryButton
        variant="outline"
        label={leftLabel}
        onPress={onLeftPress}
        style={[styles.actionBtn, styles.cancelBtn]}
        labelStyle={styles.cancelLabelStyle}
      />
      <PrimaryButton
        label={rightLabel}
        onPress={onRightPress}
        isLoading={rightLoading}
        disabled={rightDisabled}
        style={[styles.actionBtn, styles.nextBtn]}
        labelStyle={styles.nextLabelStyle}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: '#e4e4e7',
    backgroundColor: '#fff',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  actionBtn: {
    height: 40,
    paddingVertical: 8,
    paddingHorizontal: 32,
    borderRadius: 999,
  },
  cancelBtn: {
    width: 120,
    backgroundColor: '#fff',
    borderColor: '#e4e4e7',
    borderWidth: 1,
    elevation: 2,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  nextBtn: {
    flex: 1,
    borderColor: '#44ffff',
    elevation: 3,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    shadowOpacity: 1,
  },
  cancelLabelStyle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
    color: '#18181b',
  },
  nextLabelStyle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'left',
    color: '#fafafa',
  },
});
