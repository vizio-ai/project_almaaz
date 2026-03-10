import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { AppText } from '@shared/ui-kit';

interface ImportTripPlanCardProps {
  onPress: () => void;
}

export function ImportTripPlanCard({ onPress }: ImportTripPlanCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <AppText style={styles.title}>IMPORT YOUR TRIP PLAN</AppText>
      <AppText style={styles.description}>
        Already have your own trip notes?{'\n'}Paste all in here so your agent structure them for you.
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    marginTop: 2,
  },
});
