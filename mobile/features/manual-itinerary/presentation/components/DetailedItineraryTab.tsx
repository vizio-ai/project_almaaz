import React from 'react';
import { View, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { Plus } from 'lucide-react-native';
import {
  AppText,
  PrimaryButton,
  useThemeColor,
  spacing,
  radii,
  typography,
  AccordionSection,
  NoteCard,
} from '@shared/ui-kit';
import { NoteCreateCard } from './NoteCreateCard';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { ItineraryDay } from '../../domain/entities/ItineraryDay';
import type { Activity } from '../../domain/entities/Activity';
import { DaySection } from './DaySection';
import { AccommodationCard } from './AccommodationCard';
import { AccommodationEditCard } from './AccommodationEditCard';
import { ActivityCard } from './ActivityCard';
import { ActivityEditCard } from './ActivityEditCard';
import { AddAnotherActivityButton } from './AddAnotherActivityButton';
import { LocationMapModal } from './LocationMapModal';

export interface DetailedItineraryTabProps {
  /** 'create' → local draft state, 'edit' → Supabase-backed */
  mode: 'create' | 'edit';
  days: ItineraryDay[];
  activitiesByDay: Record<string, Activity[]>;

  // Edit mode props (Supabase-backed)
  collapsedDays?: Set<string>;
  onToggleDay?: (dayId: string) => void;
  onAddActivity?: (dayId: string, params: import('../../domain/repository/ManualItineraryRepository').AddActivityParams) => Promise<unknown>;
  onEditActivity?: (activityId: string, params: import('../../domain/repository/ManualItineraryRepository').UpdateActivityParams) => Promise<unknown>;
  onRemoveActivity?: (activityId: string) => Promise<unknown>;
  onUpdateDay?: (dayId: string, params: import('../../domain/repository/ManualItineraryRepository').UpdateDayParams) => Promise<unknown>;
  onRemoveDay?: (dayId: string) => Promise<unknown>;
  onAddDay?: () => Promise<unknown>;
  onUpdateActivityLocation?: (
    activityId: string,
    locationText: string | null,
    latitude: number | null,
    longitude: number | null,
  ) => Promise<unknown>;
  onReorderActivities?: (dayId: string, orderedIds: string[]) => Promise<unknown>;
  onReorderDays?: (orderedDayIds: string[]) => Promise<unknown>;
  isNew?: boolean;
  border?: string;

  // Shared / styling
  secondary: string;

  /** Base trip location (e.g. "Tokyo, Japan") used to initialise activity location picker. */
  baseLocation?: string;

  // Create mode props (draft-only)
  draftDayNotes?: Record<string, string>;
  onChangeDraftDayNote?: (dayId: string, note: string) => void;
  /** Called whenever draft activities change so the parent can persist them on save. */
  onDraftActivitiesChange?: (
    byDraftDayId: Record<string, { name: string; locationText: string | null }[]>,
  ) => void;
  /** Called whenever draft accommodation changes so the parent can persist them on save. */
  onDraftAccommodationChange?: (accommodation: Record<string, string | null>) => void;
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
  onUpdateActivityLocation,
  onReorderActivities,
  onReorderDays: _onReorderDays,
  isNew,
  border,
  secondary,
  draftDayNotes,
  onChangeDraftDayNote,
  onDraftActivitiesChange,
  onDraftAccommodationChange,
  baseLocation,
}: DetailedItineraryTabProps) {
  const textColor = useThemeColor('text');
  // Local collapse state for create mode (draft days are not in DB yet)
  const [collapsedDraft, setCollapsedDraft] = React.useState<Set<string>>(() => new Set());
  const [editingAccommodationDayId, setEditingAccommodationDayId] = React.useState<string | null>(
    null,
  );
  const [editingActivityId, setEditingActivityId] = React.useState<string | null>(null);
  const [draftAccommodationByDay, setDraftAccommodationByDay] = React.useState<
    Record<
      string,
      {
        name: string | null;
      }
    >
  >({});
  const [draftActivitiesByDay, setDraftActivitiesByDay] = React.useState<
    Record<
      string,
      {
        id: string;
        name: string;
        activityType?: 'park' | 'museum' | 'food' | 'shopping' | 'historic' | 'beach' | null;
        locationText?: string | null;
        timeValue?: string | null;
      }[]
    >
  >({});
  const [timePickerActivityId, setTimePickerActivityId] = React.useState<string | null>(null);
  const [timePickerDate, setTimePickerDate] = React.useState<Date>(new Date());
  const [locationModalVisible, setLocationModalVisible] = React.useState(false);
  const [locationModalActivityId, setLocationModalActivityId] = React.useState<string | null>(null);
  const [locationModalInitialQuery, setLocationModalInitialQuery] = React.useState('');
  const [accommodationLocationModalVisible, setAccommodationLocationModalVisible] =
    React.useState(false);
  const [accommodationLocationDayId, setAccommodationLocationDayId] =
    React.useState<string | null>(null);
  const [accommodationLocationInitialQuery, setAccommodationLocationInitialQuery] =
    React.useState('');
  const [noteEditingDayId, setNoteEditingDayId] = React.useState<string | null>(null);

  const surface = useThemeColor('surface');
  const accent = useThemeColor('accent');

  // Seed initial activities only for days that have never been seeded (so Delete doesn't re-add).
  React.useEffect(() => {
    if (mode !== 'create') return;
    if (!days.length) return;

    setDraftActivitiesByDay((prev) => {
      const next: typeof prev = { ...prev };
      let changed = false;

      days.forEach((day) => {
        if (!(day.id in prev)) {
          const baseId = `draft-activity-${day.id}-`;
          next[day.id] = [
            {
              id: `${baseId}1`,
              name: '',
              activityType: 'park',
              locationText: null,
              timeValue: null,
            },
          ];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [mode, days]);

  // Ensure each draft day has an accommodation name (used by AccommodationCard/Edit)
  React.useEffect(() => {
    if (mode !== 'create') return;
    if (!days.length) return;

    setDraftAccommodationByDay((prev) => {
      const next: typeof prev = { ...prev };
      let changed = false;

      days.forEach((day) => {
        if (!next[day.id]) {
          next[day.id] = { name: null };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [mode, days]);

  // Notify parent of draft activity changes so it can save them on submit.
  React.useEffect(() => {
    if (mode !== 'create' || !onDraftActivitiesChange) return;
    const simplified: Record<string, { name: string; locationText: string | null }[]> = {};
    for (const [dayId, acts] of Object.entries(draftActivitiesByDay)) {
      const named = acts
        .filter((a) => a.name.trim())
        .map((a) => ({ name: a.name.trim(), locationText: a.locationText ?? null }));
      if (named.length > 0) simplified[dayId] = named;
    }
    onDraftActivitiesChange(simplified);
  }, [mode, draftActivitiesByDay, onDraftActivitiesChange]);

  // Notify parent of draft accommodation changes so it can save them on submit.
  React.useEffect(() => {
    if (mode !== 'create' || !onDraftAccommodationChange) return;
    const result: Record<string, string | null> = {};
    for (const [dayId, acc] of Object.entries(draftAccommodationByDay)) {
      result[dayId] = acc.name ?? null;
    }
    onDraftAccommodationChange(result);
  }, [mode, draftAccommodationByDay, onDraftAccommodationChange]);

  if (!days.length) {
    return null;
  }

  if (mode === 'edit') {
    // Edit mode: real days/activities from Supabase
    // TODO: day-level drag-and-drop reordering (onReorderDays) — deferred until backend behavior confirmed
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
            onUpdateActivityLocation={onUpdateActivityLocation}
            onReorderActivities={onReorderActivities}
            baseLocation={baseLocation}
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
      const next = [
        ...existing,
        { id, name: '', activityType: 'park' as const, locationText: null, timeValue: null },
      ];
      return { ...prev, [dayId]: next };
    });
  };

  const updateDraftAccommodationName = (dayId: string, name: string) => {
    setDraftAccommodationByDay((prev) => ({
      ...prev,
      [dayId]: { name },
    }));
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

  const updateDraftActivityType = (
    activityId: string,
    activityType: 'park' | 'museum' | 'food' | 'shopping' | 'historic' | 'beach',
  ) => {
    setDraftActivitiesByDay((prev) => {
      const next: typeof prev = {};
      for (const [dayId, list] of Object.entries(prev)) {
        next[dayId] = list.map((a) => (a.id === activityId ? { ...a, activityType } : a));
      }
      return next;
    });
  };

  const updateDraftActivityTime = (activityId: string, timeValue: string) => {
    setDraftActivitiesByDay((prev) => {
      const next: typeof prev = {};
      for (const [dayId, list] of Object.entries(prev)) {
        next[dayId] = list.map((a) => (a.id === activityId ? { ...a, timeValue } : a));
      }
      return next;
    });
  };

  const updateDraftActivityLocation = (activityId: string, locationText: string) => {
    setDraftActivitiesByDay((prev) => {
      const next: typeof prev = {};
      for (const [dayId, list] of Object.entries(prev)) {
        next[dayId] = list.map((a) => (a.id === activityId ? { ...a, locationText } : a));
      }
      return next;
    });
  };

  const openTimePicker = (activityId: string) => {
    setTimePickerActivityId(activityId);
    setTimePickerDate(new Date());
  };

  const closeTimePicker = () => {
    setTimePickerActivityId(null);
  };

  const formatTimeLabel = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleConfirmTime = () => {
    if (!timePickerActivityId) return;
    const label = formatTimeLabel(timePickerDate);
    updateDraftActivityTime(timePickerActivityId, label);
    closeTimePicker();
  };

  const openAccommodationLocationModal = (dayId: string) => {
    const currentName = draftAccommodationByDay[dayId]?.name ?? '';
    const fallback = baseLocation && baseLocation !== '—' ? baseLocation : '';
    const query = currentName.trim() ? currentName : fallback;
    setAccommodationLocationDayId(dayId);
    setAccommodationLocationInitialQuery(query);
    setAccommodationLocationModalVisible(true);
  };

  const handleSelectAccommodationLocation = (locationName: string) => {
    if (accommodationLocationDayId) {
      updateDraftAccommodationName(accommodationLocationDayId, locationName);
    }
    setAccommodationLocationModalVisible(false);
    setAccommodationLocationDayId(null);
  };

  const openLocationModal = (activityId: string, initialQuery: string) => {
    const fallback = baseLocation && baseLocation !== '—' ? baseLocation : '';
    const query = initialQuery.trim() ? initialQuery : fallback;
    setLocationModalActivityId(activityId);
    setLocationModalInitialQuery(query);
    setLocationModalVisible(true);
  };

  const handleSelectLocation = (locationName: string) => {
    if (locationModalActivityId) {
      updateDraftActivityLocation(locationModalActivityId, locationName);
    }
    setLocationModalVisible(false);
    setLocationModalActivityId(null);
  };

  const removeDraftActivity = (dayId: string, activityId: string) => {
    setDraftActivitiesByDay((prev) => {
      const list = prev[dayId];
      if (!list) return prev;
      const nextList = list.filter((a) => a.id !== activityId);
      if (nextList.length === list.length) return prev;
      return { ...prev, [dayId]: nextList };
    });
    setEditingActivityId(null);
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
            {!noteValue && noteEditingDayId !== day.id ? (
              <PrimaryButton
                variant="outline"
                label="Add Note"
                onPress={() => setNoteEditingDayId(day.id)}
                style={styles.addNoteBtn}
              />
            ) : noteEditingDayId === day.id ? (
              <NoteCreateCard
                value={noteValue}
                onChange={(text) => onChangeDraftDayNote?.(day.id, text)}
                onSave={() => setNoteEditingDayId(null)}
              />
            ) : (
              <NoteCard
                title="Note"
                value={noteValue}
                placeholder="Finally making this dream trip happen! Don't forget..."
                onChangeText={(text) => onChangeDraftDayNote?.(day.id, text)}
              />
            )}

            <View style={styles.accordionContent}>
              {/* Accommodation summary / edit */}
              {editingAccommodationDayId === day.id ? (
                <AccommodationEditCard
                  selectedName={draftAccommodationByDay[day.id]?.name ?? 'Select accommodation'}
                  onClose={() => setEditingAccommodationDayId(null)}
                  onPressSelect={() => openAccommodationLocationModal(day.id)}
                  onDelete={() => {
                    updateDraftAccommodationName(day.id, '');
                    setEditingAccommodationDayId(null);
                  }}
                  onSave={() => setEditingAccommodationDayId(null)}
                />
              ) : (
                <AccommodationCard
                  title={draftAccommodationByDay[day.id]?.name ?? 'Select accommodation'}
                  onPress={() => setEditingAccommodationDayId(day.id)}
                />
              )}

              {/* Activities */}
              <DraggableFlatList
                data={dayActivities}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                activationDistance={10}
                contentContainerStyle={{ gap: spacing.md }}
                onDragEnd={({ data }) => {
                  setDraftActivitiesByDay((prev) => ({
                    ...prev,
                    [day.id]: data,
                  }));
                }}
                renderItem={({ item: act, drag }) => {
                  const id = act.id;
                  const isEditing = editingActivityId === id;

                  if (isEditing) {
                    return (
                      <ActivityEditCard
                        key={id}
                        title={act?.name ?? 'Visit Nakano Dori'}
                        name={act?.name ?? ''}
                        activityType={act?.activityType ?? 'park'}
                        timeValue={act?.timeValue ?? ''}
                        placeValue={act?.locationText ?? ''}
                        onChangeName={(value) => updateDraftActivityName(id, value)}
                        onChangeActivityType={(type) => updateDraftActivityType(id, type)}
                        onPressTime={() => openTimePicker(id)}
                        onPressPlace={() => openLocationModal(id, act?.locationText ?? '')}
                        onDelete={() => removeDraftActivity(day.id, id)}
                        onSave={() => setEditingActivityId(null)}
                        onClose={() => setEditingActivityId(null)}
                      />
                    );
                  }

                  return (
                    <ScaleDecorator>
                      <ActivityCard
                        key={id}
                        title={act.name || 'Visit Nakano Dori'}
                        tags={[
                          {
                            label:
                              act.activityType === 'museum'
                                ? 'Museum'
                                : act.activityType === 'food'
                                ? 'Food & Drink'
                                : act.activityType === 'shopping'
                                ? 'Shopping'
                                : act.activityType === 'historic'
                                ? 'Historic place'
                                : act.activityType === 'beach'
                                ? 'Beach'
                                : 'Park',
                            icon: 'type',
                          },
                          // Seçilen konum (yoksa placeholder)
                          { label: act.locationText || 'Add location', icon: 'location' },
                          // Seçilen zaman (yoksa placeholder)
                          { label: act.timeValue || 'Add time', icon: 'time' },
                        ]}
                        onPress={() => setEditingActivityId(id)}
                        onPressEdit={() => setEditingActivityId(id)}
                        // Long-press on the card starts drag
                        onMoveDown={drag}
                      />
                    </ScaleDecorator>
                  );
                }}
              />

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

      {/* Time picker for activity time selection */}
      {timePickerActivityId &&
        (Platform.OS === 'android' ? (
          <DateTimePicker
            value={timePickerDate}
            mode="time"
            display="default"
            onChange={(_, date) => {
              if (!date) {
                closeTimePicker();
                return;
              }
              const label = formatTimeLabel(date);
              updateDraftActivityTime(timePickerActivityId, label);
              closeTimePicker();
            }}
          />
        ) : (
          <Modal visible transparent animationType="none" onRequestClose={closeTimePicker}>
            <View style={styles.timeOverlay}>
              <TouchableOpacity
                style={styles.timeScrim}
                activeOpacity={1}
                onPress={closeTimePicker}
              />
              <View style={[styles.timeSheet, { backgroundColor: surface }]}>
                <AppText style={[styles.timeTitle, { color: secondary }]}>Select time</AppText>
                <DateTimePicker
                  value={timePickerDate}
                  mode="time"
                  display="spinner"
                  onChange={(_, date) => {
                    if (date) setTimePickerDate(date);
                  }}
                />
                <View style={styles.timeActions}>
                  <TouchableOpacity onPress={closeTimePicker} style={styles.timeCancelBtn}>
                    <AppText style={[styles.timeCancelLabel, { color: secondary }]}>
                      Cancel
                    </AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmTime}
                    style={[styles.timeConfirmBtn, { backgroundColor: accent }]}
                  >
                    <AppText style={styles.timeConfirmLabel}>Done</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ))}

      {/* Blurred location picker for activity location (OSM-based) */}
      <LocationMapModal
        visible={locationModalVisible}
        initialQuery={locationModalInitialQuery}
        onSelect={handleSelectLocation}
        onClose={() => {
          setLocationModalVisible(false);
          setLocationModalActivityId(null);
        }}
      />

      {/* Blurred location picker for accommodation selection (hotel / stay) */}
      <LocationMapModal
        visible={accommodationLocationModalVisible}
        initialQuery={accommodationLocationInitialQuery}
        onSelect={handleSelectAccommodationLocation}
        onClose={() => {
          setAccommodationLocationModalVisible(false);
          setAccommodationLocationDayId(null);
        }}
      />
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

  addNoteBtn: {
    marginBottom: 0,
    borderColor: '#E4E4E7',
    alignSelf: 'flex-end',
    width: 105,
  },

  // Draft (create mode) content inside accordion
  accordionContent: {
    alignSelf: 'stretch',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  timeOverlay: { flex: 1, justifyContent: 'flex-end' },
  timeScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  timeSheet: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: 32,
    paddingTop: spacing.lg,
  },
  timeTitle: {
    ...typography.sm,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  timeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  timeCancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  timeCancelLabel: { ...typography.base },
  timeConfirmBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  timeConfirmLabel: { ...typography.base, fontWeight: typography.weights.semibold, color: '#fff' },
});

