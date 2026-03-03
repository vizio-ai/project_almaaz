import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Goal, MapPin, Pencil, Clock2, GripVertical } from 'lucide-react-native';
import { AppText, spacing, radii, typography, useThemeColor, elevatedCard } from '@shared/ui-kit';

export interface ActivityCardTag {
  label: string;
}

export interface ActivityCardProps {
  title: string;
  description?: string;
  tags?: ActivityCardTag[];
  onPress?: () => void;
  onPressEdit?: () => void;
  onMoveDown?: () => void;
}

export function ActivityCard({
  title,
  description,
  tags = [],
  onPress,
  onPressEdit,
  onMoveDown,
}: ActivityCardProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
      onLongPress={onMoveDown}
    >
      {/* Left stripe for drag handle visual */}
      <View style={styles.leftStripe}>
        <GripVertical size={14} color={"#A1A1AA"} strokeWidth={1.8} style={styles.gripIcon} />
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <AppText style={[styles.title, { color: textColor }]}>{title}</AppText>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={onPressEdit} activeOpacity={0.7}>
            <Pencil size={16} color={secondary} />
          </TouchableOpacity>
        </View>

        {description ? (
          <AppText style={[styles.description, { color: secondary }]} numberOfLines={3}>
            {description}
          </AppText>
        ) : null}

        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag, idx) => (
              <View key={`${tag.label}-${idx}`} style={styles.tag}>
                <View style={styles.tagIconWrapper}>
                  {renderTagIcon(tag.label, secondary)}
                </View>
                <AppText style={[styles.tagLabel, { color: secondary }]}>{tag.label}</AppText>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    position: 'relative',
    ...elevatedCard,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    padding: spacing.md,
    paddingLeft: spacing.xl + spacing.xs,
  },
  leftStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 24,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gripIcon: {
    opacity: 0.6,
  },
  content: {
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  title: {
    ...typography.sm,
    lineHeight: 20,
    fontWeight: '600',
  },
  iconButton: {
    height: 24,
    width: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    ...typography.sm,
    lineHeight: 20,
    color: '#71717a',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagIconWrapper: {
    height: 20,
    width: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagLabel: {
    ...typography.sm,
    lineHeight: 20,
  },
});

function renderTagIcon(label: string, color: string) {
  const lower = label.toLowerCase();

  if (lower === 'park' || lower === 'goal') {
    return <Goal width={12} height={12} color={color} strokeWidth={1.8} />;
  }

  if (lower.includes('nakano dori') || lower.includes('place')) {
    return <MapPin width={12} height={12} color={color} strokeWidth={1.8} />;
  }

  if (lower === 'afternoon' || lower === 'morning' || lower === 'evening') {
    return <Clock2 width={12} height={12} color={color} strokeWidth={1.8} />;
  }

  return null;
}


