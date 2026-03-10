import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Bed, Pencil, ChevronRight } from 'lucide-react-native';
import { AppText, spacing, radii, typography, useThemeColor, elevatedCard } from '@shared/ui-kit';

export interface AccommodationCardProps {
  title: string;
  description?: string;
  onPress?: () => void;
}

export function AccommodationCard({ title, description, onPress }: AccommodationCardProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.row}>
        <View style={styles.leftWrapper}>
          <View style={styles.iconButton}>
            <Bed size={16} color={textColor} />
          </View>
          <AppText
            style={[styles.title, { color: textColor }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </AppText>
        </View>

        <View style={styles.iconButton}>
          <Pencil size={16} color={secondary} />
        </View>
      </View>

      {description?.trim() ? (
        <AppText style={[styles.description, { color: secondary }]} numberOfLines={2}>
          {description}
        </AppText>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    ...elevatedCard,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: spacing.md,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  row: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  leftWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    height: 24,
    width: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.sm,
    lineHeight: 20,
    fontWeight: '600',
    flexShrink: 1,
  },
  description: {
    ...typography.sm,
    lineHeight: 20,
    color: '#71717a',
  },
});

