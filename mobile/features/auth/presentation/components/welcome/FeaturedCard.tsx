import React from 'react';
import { TouchableOpacity, StyleSheet, Text } from 'react-native';
import { AppText } from '@shared/ui-kit';

interface FeaturedCardProps {
  onPress?: () => void;
}

export function FeaturedCard({ onPress }: FeaturedCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.plus}>+</Text>
      <AppText style={styles.label}>Start a new trip plan</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 8,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 1.5,
    elevation: 2,
  },
  plus: {
    fontSize: 20,
    lineHeight: 20,
    color: '#18181B',
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181B',
  },
});
