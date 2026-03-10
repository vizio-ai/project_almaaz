import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@shared/ui-kit';
import type { TripFormData } from '../../domain/entities/ChatSession';

const BUDGET_LABELS: Record<string, string> = {
  'budget-friendly': 'Budget-Friendly',
  'mid-range': 'Mid-Range',
  premium: 'Premium',
  luxury: 'Luxury',
};

interface TripSummaryCardProps {
  tripDetails: TripFormData;
}

export function TripSummaryCard({ tripDetails }: TripSummaryCardProps) {
  const dateRange = formatDateRange(tripDetails.startDate, tripDetails.endDate);
  const budgetLabel = BUDGET_LABELS[tripDetails.budget] || tripDetails.budget;

  return (
    <View style={styles.card}>
      <AppText style={styles.title}>{tripDetails.title}</AppText>

      <View style={styles.row}>
        <Ionicons name="location-outline" size={14} color="#71717A" />
        <AppText style={styles.detail}>{tripDetails.destination}</AppText>
      </View>

      <View style={styles.row}>
        <Ionicons name="calendar-outline" size={14} color="#71717A" />
        <AppText style={styles.detail}>{dateRange}</AppText>
      </View>

      <View style={styles.row}>
        <Ionicons name="globe-outline" size={14} color="#71717A" />
        <AppText style={styles.detail}>{budgetLabel}</AppText>
      </View>
    </View>
  );
}

function formatDateRange(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    return `${s.toLocaleDateString('en-US', opts)} - ${e.toLocaleDateString('en-US', opts)}`;
  } catch {
    return `${start} - ${end}`;
  }
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
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detail: {
    fontSize: 13,
    color: '#71717A',
  },
});
