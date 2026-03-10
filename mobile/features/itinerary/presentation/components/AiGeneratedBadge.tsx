import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@shared/ui-kit';

interface AiGeneratedBadgeProps {
  compact?: boolean;
}

export function AiGeneratedBadge({ compact }: AiGeneratedBadgeProps) {
  return (
    <View style={[styles.badge, compact && styles.badgeCompact]}>
      <Ionicons name="sparkles" size={compact ? 12 : 14} color="#18181B" />
      <AppText style={[styles.text, compact && styles.textCompact]}>
        AI Generated
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F4F4F5',
  },
  badgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#18181B',
  },
  textCompact: {
    fontSize: 11,
  },
});
