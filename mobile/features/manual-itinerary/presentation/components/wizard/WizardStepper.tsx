import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check, Clipboard, ChevronRight, Plane, Waypoints, ListChecks } from 'lucide-react-native';
import { AppText, useThemeColor, spacing, typography } from '@shared/ui-kit';

const STEP_ICONS = [Clipboard, Plane, Waypoints, ListChecks] as const;

const STEPS = [
  { label: 'Basic Details' },
  { label: 'Travel Information' },
  { label: 'Trip Plan' },
  { label: 'Confirmation' },
] as const;

interface WizardStepperProps {
  currentStep: number;
}

export function WizardStepper({ currentStep }: WizardStepperProps) {
  const secondary = useThemeColor('textSecondary');

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const StepIcon = STEP_ICONS[index];
          const iconColor = isActive ? '#18181b' : secondary;

          return (
            <React.Fragment key={step.label}>
              {index > 0 && (
                <View style={styles.connector}>
                  <ChevronRight size={16} color={secondary} />
                </View>
              )}
              <View
                style={[
                  styles.pill,
                  !isActive && styles.pillInactive,
                  isActive && styles.pillActive,
                ]}
              >
                {isCompleted ? (
                  <Check size={16} color={"#16A34A"} />
                ) : (
                  <StepIcon size={16} color={iconColor} />
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
    backgroundColor: '#f4f4f5',
    padding: 2,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  pill: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  pillInactive: {
    width: 36,
  },
  pillActive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#e4e4e7',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#18181b',
    textAlign: 'left',
  },
  connector: {
    justifyContent: 'center',
  },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 1,
  },
});
