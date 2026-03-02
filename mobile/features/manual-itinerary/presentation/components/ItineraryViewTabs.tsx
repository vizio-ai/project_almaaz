import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor, spacing, radii, typography } from '@shared/ui-kit';
import type { ItineraryDay } from '../../domain/entities/ItineraryDay';
import type { Activity } from '../../domain/entities/Activity';
import { DaySection } from './DaySection';

export type ItineraryViewTab = 'detailed' | 'summary' | 'map';

export interface ItineraryViewTabsProps {
  viewTab: ItineraryViewTab;
  onChangeTab: (tab: ItineraryViewTab) => void;
  days: ItineraryDay[];
  activitiesByDay: Record<string, Activity[]>;
  collapsedDays: Set<string>;
  onToggleDay: (dayId: string) => void;
  onAddActivity: (dayId: string, name: string) => Promise<unknown>;
  onEditActivity: (activityId: string, name: string) => Promise<unknown>;
  onRemoveActivity: (activityId: string) => Promise<unknown>;
  onUpdateDay: (dayId: string, notes: string | null) => Promise<unknown>;
  onRemoveDay: (dayId: string) => Promise<unknown>;
  onAddDay: () => Promise<unknown>;
  isNew: boolean;
}

export function ItineraryViewTabs({
  viewTab,
  onChangeTab,
  days,
  activitiesByDay,
  collapsedDays,
  onToggleDay,
  onAddActivity,
  onEditActivity,
  onRemoveActivity,
  onUpdateDay,
  onRemoveDay,
  onAddDay,
  isNew,
}: ItineraryViewTabsProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surfaceAlt = useThemeColor('surfaceAlt');
  const border = useThemeColor('border');

  return (
    <>
      <View style={styles.tabs}>
        {(['detailed', 'summary', 'map'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => onChangeTab(tab)}
            style={[styles.tab, viewTab === tab && { backgroundColor: textColor }]}
          >
            <AppText
              style={[
                styles.tabLabel,
                { color: viewTab === tab ? surfaceAlt : textColor },
              ]}
            >
              {tab === 'detailed'
                ? 'Detailed View'
                : tab === 'summary'
                ? 'Summary View'
                : 'Map View'}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {viewTab === 'detailed' && (
        <DetailedItineraryTab
          days={days}
          activitiesByDay={activitiesByDay}
          collapsedDays={collapsedDays}
          onToggleDay={onToggleDay}
          onAddActivity={onAddActivity}
          onEditActivity={onEditActivity}
          onRemoveActivity={onRemoveActivity}
          onUpdateDay={onUpdateDay}
          onRemoveDay={onRemoveDay}
          onAddDay={onAddDay}
          isNew={isNew}
          border={border}
          secondary={secondary}
        />
      )}

      {viewTab === 'summary' && <SummaryItineraryTab secondary={secondary} />}
      {viewTab === 'map' && <MapItineraryTab secondary={secondary} />}
    </>
  );
}

interface DetailedItineraryTabProps {
  days: ItineraryDay[];
  activitiesByDay: Record<string, Activity[]>;
  collapsedDays: Set<string>;
  onToggleDay: (dayId: string) => void;
  onAddActivity: (dayId: string, name: string) => Promise<unknown>;
  onEditActivity: (activityId: string, name: string) => Promise<unknown>;
  onRemoveActivity: (activityId: string) => Promise<unknown>;
  onUpdateDay: (dayId: string, notes: string | null) => Promise<unknown>;
  onRemoveDay: (dayId: string) => Promise<unknown>;
  onAddDay: () => Promise<unknown>;
  isNew: boolean;
  border: string;
  secondary: string;
}

function DetailedItineraryTab({
  days,
  activitiesByDay,
  collapsedDays,
  onToggleDay,
  onAddActivity,
  onEditActivity,
  onRemoveActivity,
  onUpdateDay,
  onRemoveDay,
  onAddDay,
  isNew,
  border,
  secondary,
}: DetailedItineraryTabProps) {
  return (
    <>
      {days.map((day) => (
        <DaySection
          key={day.id}
          day={day}
          dayActivities={activitiesByDay[day.id] ?? []}
          isCollapsed={collapsedDays.has(day.id)}
          onToggle={() => onToggleDay(day.id)}
          onAddActivity={onAddActivity}
          onEditActivity={onEditActivity}
          onRemoveActivity={onRemoveActivity}
          onUpdateDay={onUpdateDay}
          onRemoveDay={onRemoveDay}
        />
      ))}

      <TouchableOpacity
        style={[styles.addDayBtn, { borderColor: border }]}
        onPress={onAddDay}
        disabled={isNew}
      >
        <Ionicons name="add" size={18} color={secondary} />
        <AppText style={[styles.addDayLabel, { color: secondary }]}>Add Day</AppText>
      </TouchableOpacity>
    </>
  );
}

function SummaryItineraryTab({ secondary }: { secondary: string }) {
  return (
    <View style={styles.placeholderBlock}>
      <AppText style={[styles.placeholderText, { color: secondary }]}>
        Summary view — coming soon
      </AppText>
    </View>
  );
}

function MapItineraryTab({ secondary }: { secondary: string }) {
  return (
    <View style={styles.placeholderBlock}>
      <AppText style={[styles.placeholderText, { color: secondary }]}>
        Map view — coming soon
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.rounded,
  },
  tabLabel: { ...typography.caption, fontWeight: typography.weights.medium },
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  addDayLabel: { ...typography.sm, fontWeight: typography.weights.medium },
  placeholderBlock: { paddingVertical: spacing['2xl'], alignItems: 'center' },
  placeholderText: { ...typography.sm },
});

