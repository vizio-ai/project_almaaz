import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { spacing, radii, typography, elevatedCard, colors } from '../theme';

export interface InfoCardProps {
  title: string;
  description?: string | null;
  iconName?: keyof typeof Ionicons.glyphMap | string;
}

const c = colors.light;

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
    borderRadius: radii.lg,
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.borderMuted,
    padding: spacing.md,
    ...elevatedCard,
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
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.surfaceMuted,
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
