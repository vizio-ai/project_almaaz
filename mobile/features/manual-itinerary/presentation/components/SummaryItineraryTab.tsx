import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, spacing, typography, colors, radii } from '@shared/ui-kit';
import type { ItineraryDay } from '../../domain/entities/ItineraryDay';
import type { Activity } from '../../domain/entities/Activity';

const ACTIVITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  park: 'leaf-outline',
  museum: 'business-outline',
  food: 'restaurant-outline',
  shopping: 'bag-outline',
  historic: 'library-outline',
  beach: 'sunny-outline',
};

interface Props {
  secondary: string;
  isAiGenerated?: boolean;
  days?: ItineraryDay[];
  activitiesByDay?: Record<string, Activity[]>;
  isGeneratingSummary?: boolean;
}

const c = colors.light;

export function SummaryItineraryTab({
  secondary,
  isAiGenerated,
  days,
  activitiesByDay,
  isGeneratingSummary,
}: Props) {
  if (!days || days.length === 0) {
    return (
      <View style={styles.placeholderBlock}>
        <AppText style={[styles.placeholderText, { color: secondary }]}>
          Add days and activities to see your trip summary
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isGeneratingSummary && (
        <View style={styles.generatingRow}>
          <ActivityIndicator size="small" color={c.labelText} />
          <AppText style={styles.generatingText}>Generating AI summaries...</AppText>
        </View>
      )}

      {days.map((day) => {
        const dayActivities = activitiesByDay?.[day.id] ?? [];
        const summaryText = day.summary || null;

        return (
          <View key={day.id} style={styles.dayCard}>
            {/* Day header */}
            <View style={styles.dayHeader}>
              <AppText style={styles.dayLabel}>
                Day {day.dayNumber}{' '}
                {day.date
                  ? new Date(day.date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : ''}
              </AppText>
              {(isAiGenerated || summaryText) && (
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={12} color={c.labelText} />
                  <AppText style={styles.aiBadgeText}>AI Summary</AppText>
                </View>
              )}
            </View>

            {/* AI summary */}
            {summaryText ? (
              <AppText style={styles.summaryText}>{summaryText}</AppText>
            ) : dayActivities.length > 0 ? (
              <AppText style={[styles.summaryText, { color: secondary, fontStyle: 'italic' }]}>
                Summary will be generated automatically
              </AppText>
            ) : (
              <AppText style={[styles.summaryText, { color: secondary }]}>
                No activities yet
              </AppText>
            )}

            {/* Accommodation */}
            {day.accommodation && (
              <View style={styles.accommodationRow}>
                <Ionicons name="bed-outline" size={14} color={c.subText} />
                <AppText style={styles.accommodationText}>{day.accommodation}</AppText>
              </View>
            )}

            {/* Activity list */}
            {dayActivities.length > 0 && (
              <View style={styles.activityList}>
                {dayActivities.map((act) => (
                  <View key={act.id} style={styles.activityRow}>
                    <Ionicons
                      name={ACTIVITY_ICONS[act.activityType ?? ''] ?? 'location-outline'}
                      size={14}
                      color={c.subText}
                    />
                    <View style={styles.activityInfo}>
                      <AppText style={styles.activityName}>{act.name}</AppText>
                      {(act.startTime || act.locationText) && (
                        <AppText style={styles.activityMeta}>
                          {[act.startTime, act.locationText].filter(Boolean).join(' · ')}
                        </AppText>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* User notes (if separate from summary) */}
            {day.notes && (
              <View style={styles.notesRow}>
                <Ionicons name="document-text-outline" size={14} color={c.subText} />
                <AppText style={styles.notesText}>{day.notes}</AppText>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholderBlock: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  placeholderText: { ...typography.sm },
  container: {
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: c.surface,
    borderRadius: radii.md,
  },
  generatingText: {
    ...typography.caption,
    color: c.subText,
  },
  dayCard: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: c.surfaceMuted,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: {
    ...typography.sm,
    fontWeight: typography.weights.semibold,
    color: c.labelText,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
    backgroundColor: c.surfaceMuted,
  },
  aiBadgeText: {
    ...typography['2xs'],
    fontWeight: typography.weights.medium,
    color: c.labelText,
  },
  summaryText: {
    ...typography.caption,
    lineHeight: 20,
    color: c.subText,
  },
  accommodationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm - 2,
    marginTop: 2,
  },
  accommodationText: {
    ...typography.xs,
    color: c.subText,
  },
  activityList: {
    gap: spacing.sm - 2,
    marginTop: spacing.xs,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingLeft: spacing.xs,
  },
  activityInfo: {
    flex: 1,
    gap: 1,
  },
  activityName: {
    ...typography.caption,
    fontWeight: typography.weights.medium,
    color: c.labelText,
  },
  activityMeta: {
    ...typography['2xs'],
    color: c.textTertiary,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm - 2,
    marginTop: spacing.xs,
    paddingTop: spacing.sm - 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.surfaceMuted,
  },
  notesText: {
    ...typography.xs,
    lineHeight: 18,
    color: c.subText,
    flex: 1,
    fontStyle: 'italic',
  },
});
