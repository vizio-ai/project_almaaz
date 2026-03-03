import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText, spacing, typography } from '@shared/ui-kit';

interface Props {
  secondary: string;
}

export function SummaryItineraryTab({ secondary }: Props) {
  return (
    <View style={styles.placeholderBlock}>
      <AppText style={[styles.placeholderText, { color: secondary }]}>
        Summary view — coming soon
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholderBlock: { paddingVertical: spacing['2xl'], alignItems: 'center' },
  placeholderText: { ...typography.sm },
});

