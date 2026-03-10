import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { spacing, radii, typography } from '../theme';

export interface InfoCardProps {
  title: string;
  description?: string | null;
  iconName?: keyof typeof Ionicons.glyphMap | string;
}

export function InfoCard({ title, description, iconName = 'information-circle-outline' }: InfoCardProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {iconName ? (
            <View style={styles.iconCircle}>
              <Ionicons name={iconName as any} size={16} color={textColor} />
            </View>
          ) : null}
          <AppText style={[styles.title, { color: textColor }]}>{title}</AppText>
        </View>
      </View>
      {description ? (
        <AppText style={[styles.description, { color: secondary }]}>{description}</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f5',
  },
  title: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
  },
  description: {
    ...typography.sm,
    marginTop: spacing.xs,
  },
});

