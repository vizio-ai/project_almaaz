import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from '@shared/ui-kit';
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
    gap: 8,
  },
  pill: {
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  pillSelected: {
    backgroundColor: '#18181B',
    borderColor: '#18181B',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#18181B',
  },
  pillTextSelected: {
    color: '#FAFAFA',
  },
});
