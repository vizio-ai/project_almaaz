import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, spacing, typography } from '@shared/ui-kit';
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
          <ActivityIndicator size="small" color="#18181B" />
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
                  <Ionicons name="sparkles" size={12} color="#18181B" />
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
                <Ionicons name="bed-outline" size={14} color="#71717A" />
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
                      color="#71717A"
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
                <Ionicons name="document-text-outline" size={14} color="#71717A" />
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
    gap: 16,
    paddingVertical: 8,
  },
  generatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  generatingText: {
    fontSize: 13,
    color: '#52525B',
  },
  dayCard: {
    gap: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F5',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#18181B',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#F4F4F5',
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#18181B',
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#52525B',
  },
  accommodationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  accommodationText: {
    fontSize: 12,
    color: '#71717A',
  },
  activityList: {
    gap: 6,
    marginTop: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
  },
  activityInfo: {
    flex: 1,
    gap: 1,
  },
  activityName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#18181B',
  },
  activityMeta: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F4F4F5',
  },
  notesText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#71717A',
    flex: 1,
    fontStyle: 'italic',
  },
});
