import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Pencil, Clock2, GripVertical, RefreshCw } from 'lucide-react-native';
import { AppText, spacing, radii, typography, useThemeColor, elevatedCard, colors } from '@shared/ui-kit';

export interface ActivityCardTag {
  label: string;
  /** Optional semantic type to pick a specific icon (used for fixed trip tags). */
  icon?: 'type' | 'location' | 'time';
}

export interface ActivityCardProps {
  title: string;
  /** Optional free-text description. */
  description?: string;
  /** Pills shown under the title (e.g. type, location, time). */
  tags?: ActivityCardTag[];
  onPress?: () => void;
  onPressEdit?: () => void;
  onMoveDown?: () => void;
}

const c = colors.light;

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
        <GripVertical size={14} color={c.subText} strokeWidth={1.8} style={styles.gripIcon} />
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

        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag, idx) => (
              <View key={`${tag.label}-${idx}`} style={styles.tag}>
                <View style={styles.tagIconWrapper}>{renderTagIcon(tag, secondary)}</View>
                <AppText
                  style={[styles.tagLabel, { color: textColor }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {tag.label}
                </AppText>
              </View>
            ))}
          </View>
        )}

        {description ? (
          <AppText style={[styles.description, { color: secondary }]} numberOfLines={2}>
            {description}
          </AppText>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    position: 'relative',
    ...elevatedCard,
    borderRadius: radii.lg,
    backgroundColor: c.background,
    borderWidth: 1,
    borderColor: c.borderMuted,
    padding: spacing.md,
    paddingLeft: spacing.xl + spacing.xs,
  },
  leftStripe: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 24,
    backgroundColor: c.surface,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gripIcon: {},
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
    fontWeight: typography.weights.semibold,
  },
  iconButton: {
    height: 24,
    width: 24,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tagIconWrapper: {
    height: 20,
    width: 20,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagLabel: {
    ...typography.sm,
    lineHeight: 20,
    maxWidth: 100,
    flexShrink: 1,
  },
  description: {
    ...typography.sm,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
});

function renderTagIcon(tag: ActivityCardTag, color: string) {
  if (tag.icon === 'type') {
    return <RefreshCw width={12} height={12} color={color} strokeWidth={1.8} />;
  }
  if (tag.icon === 'location') {
    return <MapPin width={12} height={12} color={color} strokeWidth={1.8} />;
  }
  if (tag.icon === 'time') {
    return <Clock2 width={12} height={12} color={color} strokeWidth={1.8} />;
  }

  const lower = tag.label.toLowerCase();

  if (lower === 'park' || lower === 'goal') {
    return <RefreshCw width={12} height={12} color={color} strokeWidth={1.8} />;
  }

  if (lower.includes('nakano dori') || lower.includes('place')) {
    return <MapPin width={12} height={12} color={color} strokeWidth={1.8} />;
  }

  if (lower === 'afternoon' || lower === 'morning' || lower === 'evening') {
    return <Clock2 width={12} height={12} color={color} strokeWidth={1.8} />;
  }

  return null;
}
