import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText, AppInput } from '@shared/ui-kit';
import { BudgetSelectionPills } from './BudgetSelectionPills';
import type { BudgetLevel, TripFormData, FormSuggestions } from '../../domain/entities/ChatSession';

interface TripDetailsFormCardProps {
  suggestions?: FormSuggestions | null;
  onSubmit: (data: TripFormData) => void;
  disabled?: boolean;
}

export function TripDetailsFormCard({
  suggestions,
  onSubmit,
  disabled,
}: TripDetailsFormCardProps) {
  const [title, setTitle] = useState(suggestions?.title ?? '');
  const [destination, setDestination] = useState(suggestions?.destination ?? '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState<BudgetLevel | null>(null);

  const canSubmit =
    title.trim().length > 0 &&
    destination.trim().length > 0 &&
    startDate.trim().length > 0 &&
    endDate.trim().length > 0 &&
    budget !== null;

  const handleSubmit = () => {
    if (!canSubmit || !budget) return;
    onSubmit({
      title: title.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      budget,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.field}>
        <AppText style={styles.label}>Trip Name</AppText>
        <AppInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Tuscany Adventure"
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <AppText style={styles.label}>Destination</AppText>
        <AppInput
          value={destination}
          onChangeText={setDestination}
          placeholder="Destination"
          style={styles.input}
        />
      </View>

      <View style={styles.field}>
        <AppText style={styles.label}>Set Your Dates</AppText>
        <View style={styles.dateRow}>
          <AppInput
            value={startDate}
            onChangeText={setStartDate}
            placeholder="Start (YYYY-MM-DD)"
            style={[styles.input, styles.dateInput]}
          />
          <AppText style={styles.dateSeparator}>—</AppText>
          <AppInput
            value={endDate}
            onChangeText={setEndDate}
            placeholder="End (YYYY-MM-DD)"
            style={[styles.input, styles.dateInput]}
          />
        </View>
      </View>

      <View style={styles.field}>
        <AppText style={styles.label}>Budget Selection</AppText>
        <BudgetSelectionPills selected={budget} onSelect={setBudget} />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, (!canSubmit || disabled) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={!canSubmit || disabled}
      >
        <AppText style={styles.submitBtnText}>Submit</AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#18181B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#18181B',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
  },
  dateSeparator: {
    fontSize: 14,
    color: '#71717A',
  },
  submitBtn: {
    backgroundColor: '#18181B',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
