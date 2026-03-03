import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import { AppText, useThemeColor, spacing, radii, typography, AccordionSection, NoteCard } from '@shared/ui-kit';
import type { ItineraryDay } from '../../domain/entities/ItineraryDay';
import type { Activity } from '../../domain/entities/Activity';
import { DaySection } from './DaySection';
import { AccommodationCard } from './AccommodationCard';
import { AccommodationEditCard } from './AccommodationEditCard';
import { ActivityCard } from './ActivityCard';
import { ActivityEditCard } from './ActivityEditCard';
import { AddAnotherActivityButton } from './AddAnotherActivityButton';

export interface DetailedItineraryTabProps {
  /** 'create' → local draft state, 'edit' → Supabase-backed */
  mode: 'create' | 'edit';
  days: ItineraryDay[];
  activitiesByDay: Record<string, Activity[]>;

  // Edit mode props (Supabase-backed)
  collapsedDays?: Set<string>;
  onToggleDay?: (dayId: string) => void;
  onAddActivity?: (dayId: string, name: string) => Promise<unknown>;
  onEditActivity?: (activityId: string, name: string) => Promise<unknown>;
  onRemoveActivity?: (activityId: string) => Promise<unknown>;
  onUpdateDay?: (dayId: string, notes: string | null) => Promise<unknown>;
  onRemoveDay?: (dayId: string) => Promise<unknown>;
  onAddDay?: () => Promise<unknown>;
  isNew?: boolean;
  border?: string;

  // Shared / styling
  secondary: string;

  // Create mode props (draft-only)
  draftDayNotes?: Record<string, string>;
  onChangeDraftDayNote?: (dayId: string, note: string) => void;
}

function formatDraftDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const datePart = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${weekday} ${datePart}`;
}

export function DetailedItineraryTab({
  mode,
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
  draftDayNotes,
  onChangeDraftDayNote,
}: DetailedItineraryTabProps) {
  const textColor = useThemeColor('text');
  // Local collapse state for create mode (draft days are not in DB yet)
  const [collapsedDraft, setCollapsedDraft] = React.useState<Set<string>>(() => new Set());
  const [editingAccommodationDayId, setEditingAccommodationDayId] = React.useState<string | null>(
    null,
  );
  const [editingActivityId, setEditingActivityId] = React.useState<string | null>(null);
  const [editingActivityDayPart, setEditingActivityDayPart] = React.useState<
    Record<string, 'morning' | 'afternoon' | 'evening'>
  >({});
  const [draftActivitiesByDay, setDraftActivitiesByDay] = React.useState<
    Record<
      string,
      {
        id: string;
        name: string;
        locationText?: string | null;
      }[]
    >
  >({});

  React.useEffect(() => {
    if (mode !== 'create') return;
    if (!days.length) return;

    setDraftActivitiesByDay((prev) => {
      const next: typeof prev = { ...prev };
      let changed = false;

      days.forEach((day) => {
        const existing = next[day.id];
        if (!existing || existing.length === 0) {
          const baseId = `draft-activity-${day.id}-`;
          next[day.id] = [
            { id: `${baseId}1`, name: '', locationText: null },
            { id: `${baseId}2`, name: '', locationText: null },
          ];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [mode, days]);

  if (!days.length) {
    return null;
  }

  if (mode === 'edit') {
    // Edit mode: real days/activities from Supabase, using DaySection + external collapse state
    return (
      <>
        {days.map((day) => (
          <DaySection
            key={day.id}
            day={day}
            dayActivities={activitiesByDay[day.id] ?? []}
            isCollapsed={collapsedDays?.has(day.id) ?? false}
            onToggle={() => onToggleDay?.(day.id)}
            onAddActivity={onAddActivity ?? (async () => {})}
            onEditActivity={onEditActivity ?? (async () => {})}
            onRemoveActivity={onRemoveActivity ?? (async () => {})}
            onUpdateDay={onUpdateDay ?? (async () => {})}
            onRemoveDay={onRemoveDay ?? (async () => {})}
          />
        ))}

        <TouchableOpacity
          style={[styles.addDayBtn, border ? { borderColor: border } : null]}
          onPress={onAddDay}
          disabled={isNew}
        >
          <Plus size={18} color={secondary} strokeWidth={1.8} />
          <AppText style={[styles.addDayLabel, { color: secondary }]}>Add Day</AppText>
        </TouchableOpacity>
      </>
    );
  }

  // Create mode: draft-only accordion view following Figma design
  const toggleDraft = (dayId: string) => {
    setCollapsedDraft((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  };

  const addDraftActivity = (dayId: string) => {
    setDraftActivitiesByDay((prev) => {
      const existing = prev[dayId] ?? [];
      const id = `draft-activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const next = [...existing, { id, name: '', locationText: null }];
      return { ...prev, [dayId]: next };
    });
  };

  const updateDraftActivityName = (activityId: string, name: string) => {
    setDraftActivitiesByDay((prev) => {
      const next: typeof prev = {};
      for (const [dayId, list] of Object.entries(prev)) {
        next[dayId] = list.map((a) => (a.id === activityId ? { ...a, name } : a));
      }
      return next;
    });
  };

  const moveDraftActivityDown = (dayId: string, activityId: string) => {
    setDraftActivitiesByDay((prev) => {
      const list = prev[dayId];
      if (!list || list.length < 2) return prev;
      const index = list.findIndex((a) => a.id === activityId);
      if (index === -1 || index === list.length - 1) return prev;
      const nextList = [...list];
      const [item] = nextList.splice(index, 1);
      nextList.splice(index + 1, 0, item);
      return { ...prev, [dayId]: nextList };
    });
  };

  return (
    <>
      {days.map((day) => {
        const dayActivities = draftActivitiesByDay[day.id] ?? [];
        const noteValue = draftDayNotes?.[day.id] ?? '';

        return (
          <AccordionSection
            key={day.id}
            title={`Day ${day.dayNumber}`}
            subtitle={formatDraftDate(day.date)}
            collapsed={collapsedDraft.has(day.id)}
            onToggle={() => toggleDraft(day.id)}
          >
            <NoteCard
              title="Note"
              value={noteValue}
              placeholder="Finally making this dream trip happen! Don't forget..."
              onChangeText={(text) => onChangeDraftDayNote?.(day.id, text)}
            />

            <View style={styles.accordionContent}>
              {/* Accommodation summary / edit */}
              {editingAccommodationDayId === day.id ? (
                <AccommodationEditCard
                  selectedName="Portrait Firenze"
                  onClose={() => setEditingAccommodationDayId(null)}
                  onPressSelect={() => {}}
                  onDelete={() => {}}
                  onSave={() => setEditingAccommodationDayId(null)}
                />
              ) : (
                <AccommodationCard
                  title="Portrait Firenze"
                  onPress={() => setEditingAccommodationDayId(day.id)}
                />
              )}

              {/* Activities */}
              {dayActivities.map((act, idx) => {
                const id = act.id;
                const isEditing = editingActivityId === id;

                if (isEditing) {
                  return (
                    <ActivityEditCard
                      key={id}
                      title={act?.name ?? 'Visit Nakano Dori'}
                      name={act?.name ?? ''}
                      timeValue="" // ileride gerçek zaman alanına bağlanacak
                      placeValue={act?.locationText ?? ''}
                      onChangeName={(value) => updateDraftActivityName(id, value)}
                      onPressTime={() => {}}
                      onPressPlace={() => {}}
                      dayPart={editingActivityDayPart[id] ?? 'afternoon'}
                      onChangeDayPart={(part) =>
                        setEditingActivityDayPart((prev) => ({ ...prev, [id]: part }))
                      }
                      onCancel={() => setEditingActivityId(null)}
                      onSave={() => setEditingActivityId(null)}
                      onClose={() => setEditingActivityId(null)}
                    />
                  );
                }

                return (
                  <ActivityCard
                    key={id}
                    title={act.name || 'Visit Nakano Dori'}
                    description={
                      act.locationText ||
                      'A quiet, breathtaking tunnel of over 300 cherry trees.'
                    }
                    tags={[
                      { label: 'Park' },
                      { label: 'Nakano Dori' },
                      { label: 'Afternoon' },
                    ]}
                    onPress={() => setEditingActivityId(id)}
                    onPressEdit={() => setEditingActivityId(id)}
                    onMoveDown={() => moveDraftActivityDown(day.id, id)}
                  />
                );
              })}

              {/* Add another activity */}
              <AddAnotherActivityButton
                onPress={() => {
                  addDraftActivity(day.id);
                }}
              />
            </View>
          </AccordionSection>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  // Shared "Add Day" button (edit mode)
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

  // Draft (create mode) content inside accordion
  accordionContent: {
    alignSelf: 'stretch',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});

