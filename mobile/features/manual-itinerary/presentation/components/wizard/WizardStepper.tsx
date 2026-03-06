import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor, spacing, typography, radii } from '@shared/ui-kit';

const STEPS = [
  { label: 'Basic Details',       icon: 'document-text-outline' as const },
  { label: 'Travel Information',  icon: 'car-outline'            as const },
  { label: 'Trip Plan',           icon: 'map-outline'            as const },
  { label: 'Confirmation',        icon: 'checkmark-circle-outline' as const },
] as const;

interface WizardStepperProps {
  currentStep: number;
}

export function WizardStepper({ currentStep }: WizardStepperProps) {
  const secondary   = useThemeColor('textSecondary');
  const borderColor = useThemeColor('border');

  return (
    <View style={styles.wrapper}>
      {/* Step pills */}
      <View style={styles.row}>
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive    = index === currentStep;

          return (
            <React.Fragment key={step.label}>
              {index > 0 && (
                <View style={[styles.connector, { backgroundColor: borderColor }]} />
              )}
              <View
                style={[
                  styles.pill,
                  { borderColor },
                  isActive && styles.pillActive,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color={isActive ? '#fff' : secondary} />
                ) : (
                  <Ionicons name={step.icon} size={12} color={isActive ? '#fff' : secondary} />
                )}
                {isActive && (
                  <AppText style={styles.pillLabel}>{step.label}</AppText>
                )}
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* Section label */}
      <AppText style={[styles.sectionLabel, { color: secondary }]}>
        {STEPS[currentStep]?.label.toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.full,
    borderWidth: 1,
    paddingVertical: 5,
    paddingHorizontal: 9,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
  },
  pillLabel: {
    ...typography.caption,
    fontWeight: '500',
    color: '#fff',
  },
  connector: {
    height: 1,
    width: 14,
    marginHorizontal: 3,
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 1,
  },
});
