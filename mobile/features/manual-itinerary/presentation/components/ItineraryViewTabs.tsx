import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText, useThemeColor, spacing, radii, typography } from '@shared/ui-kit';
import type { ItineraryDay } from '../../domain/entities/ItineraryDay';
import type { Activity } from '../../domain/entities/Activity';
import { DetailedItineraryTab } from './DetailedItineraryTab';
import { SummaryItineraryTab } from './SummaryItineraryTab';
import { MapItineraryTab } from './MapItineraryTab';

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
  onUpdateActivityLocation: (
    activityId: string,
    locationText: string | null,
    latitude: number | null,
    longitude: number | null,
  ) => Promise<unknown>;
  isNew: boolean;
  /** Current trip destination text (used as base location for activity pickers in create mode). */
  destination?: string;
  /** Create mode only: local draft notes keyed by day.id (e.g. "draft-1"). */
  draftDayNotes?: Record<string, string>;
  onChangeDraftDayNote?: (dayId: string, note: string) => void;
  onDraftActivitiesChange?: (
    byDraftDayId: Record<string, { name: string; locationText: string | null }[]>,
  ) => void;
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
  onUpdateActivityLocation,
  isNew,
  destination,
  draftDayNotes,
  onChangeDraftDayNote,
  onDraftActivitiesChange,
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
          mode={isNew ? 'create' : 'edit'}
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
          onUpdateActivityLocation={onUpdateActivityLocation}
          isNew={isNew}
          border={border}
          secondary={secondary}
          baseLocation={destination}
          draftDayNotes={draftDayNotes}
          onChangeDraftDayNote={onChangeDraftDayNote}
          onDraftActivitiesChange={onDraftActivitiesChange}
        />
      )}

      {viewTab === 'summary' && <SummaryItineraryTab secondary={secondary} />}
      {viewTab === 'map' && (
        <MapItineraryTab
          secondary={secondary}
          days={days}
          activitiesByDay={activitiesByDay}
        />
      )}
    </>
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
});

