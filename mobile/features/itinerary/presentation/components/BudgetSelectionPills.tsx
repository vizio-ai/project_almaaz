import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText, colors, typography, spacing, radii } from '@shared/ui-kit';
import type { BudgetLevel } from '../../domain/entities/ChatSession';

const BUDGETS: { key: BudgetLevel; label: string }[] = [
  { key: 'budget-friendly', label: 'Budget-Friendly' },
  { key: 'mid-range', label: 'Mid-Range' },
  { key: 'premium', label: 'Premium' },
  { key: 'luxury', label: 'Luxury' },
];

interface BudgetSelectionPillsProps {
  selected: BudgetLevel | null;
  onSelect: (budget: BudgetLevel) => void;
}

const c = colors.light;

export function BudgetSelectionPills({
  selected,
  onSelect,
}: BudgetSelectionPillsProps) {
  return (
    <View style={styles.container}>
      {BUDGETS.map((b) => {
        const isSelected = selected === b.key;
        return (
          <TouchableOpacity
            key={b.key}
            style={[styles.pill, isSelected && styles.pillSelected]}
            onPress={() => onSelect(b.key)}
            activeOpacity={0.7}
          >
            <AppText
              style={[styles.pillText, isSelected && styles.pillTextSelected]}
            >
              {b.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: spacing.sm,
  },
  pill: {
    height: 36,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: c.borderMuted,
    backgroundColor: c.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: c.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pillSelected: {
    backgroundColor: c.labelText,
    borderColor: c.labelText,
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  pillText: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
    lineHeight: 20,
    color: c.labelText,
  },
  pillTextSelected: {
    color: c.surface,
  },
});
