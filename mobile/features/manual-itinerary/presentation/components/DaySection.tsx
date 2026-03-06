import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Trash2, GripVertical } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  AppText,
  AccordionSection,
  useThemeColor,
  typography,
  spacing,
} from '@shared/ui-kit';
import { DayNoteSection } from './DayNoteSection';
import type { ItineraryDay } from '../../domain/entities/ItineraryDay';
import type { Activity, ActivityType } from '../../domain/entities/Activity';
import type {
  AddActivityParams,
  UpdateActivityParams,
  UpdateDayParams,
} from '../../domain/repository/ManualItineraryRepository';
import { LocationMapModal } from './LocationMapModal';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { ActivityCard } from './ActivityCard';
import { ActivityEditCard } from './ActivityEditCard';
import { AccommodationCard } from './AccommodationCard';
import { AccommodationEditCard } from './AccommodationEditCard';
import { AddAnotherActivityButton } from './AddAnotherActivityButton';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDayLabel(dateStr: string | null, dayNumber: number): string {
  if (!dateStr) return `Day ${dayNumber}`;
  const d = new Date(dateStr);
  const dayName = d.toLocaleDateString('en-GB', { weekday: 'short' });
  return `Day ${dayNumber} · ${dayName} ${formatDate(dateStr)}`;
}

export interface DaySectionProps {
  day: ItineraryDay;
  dayActivities: Activity[];
  isCollapsed: boolean;
  onToggle: () => void;
  onAddActivity: (dayId: string, params: AddActivityParams) => Promise<unknown>;
  onEditActivity: (activityId: string, params: UpdateActivityParams) => Promise<unknown>;
  onRemoveActivity: (activityId: string) => Promise<unknown>;
  onUpdateDay: (dayId: string, params: UpdateDayParams) => Promise<unknown>;
  onRemoveDay: (dayId: string) => Promise<unknown>;
  onUpdateActivityLocation?: (
    activityId: string,
    locationText: string | null,
    latitude: number | null,
    longitude: number | null,
  ) => Promise<unknown>;
  onReorderActivities?: (dayId: string, orderedIds: string[]) => Promise<unknown>;
  onDragDay?: () => void;
  isDraggingDay?: boolean;
  baseLocation?: string;
}

export function DaySection({
  day,
  dayActivities,
  isCollapsed,
  onToggle,
  onAddActivity,
  onEditActivity,
  onRemoveActivity,
  onUpdateDay,
  onRemoveDay,
  onUpdateActivityLocation,
  onReorderActivities,
  onDragDay,
  isDraggingDay = false,
  baseLocation,
}: DaySectionProps) {
  const secondary = useThemeColor('textSecondary');

  // ── Activity list state ────────────────────────────────────────────────────
  const [orderedActivities, setOrderedActivities] = useState(dayActivities);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingActivityType, setEditingActivityType] = useState<ActivityType>('park');
  const [editingTimeValue, setEditingTimeValue] = useState('');
  const [editingLocationText, setEditingLocationText] = useState('');
  const [activityBusy, setActivityBusy] = useState(false);

  // ── Pending new activity state ─────────────────────────────────────────────
  // Auto-open the new-activity card when the day has no activities yet
  const [isPendingNew, setIsPendingNew] = useState(dayActivities.length === 0);
  const [pendingName, setPendingName] = useState('');
  const [pendingActivityType, setPendingActivityType] = useState<ActivityType>('park');
  const [pendingTimeValue, setPendingTimeValue] = useState('');
  const [pendingLocationText, setPendingLocationText] = useState('');

  // ── Time picker state ──────────────────────────────────────────────────────
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerDate, setTimePickerDate] = useState(new Date());
  const [timePickerForPending, setTimePickerForPending] = useState(false);

  // ── Location modal state ───────────────────────────────────────────────────
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationModalActivityId, setLocationModalActivityId] = useState<string | null>(null);
  const [locationModalForPending, setLocationModalForPending] = useState(false);
  const [locationModalInitialQuery, setLocationModalInitialQuery] = useState('');

  // ── Accommodation state ────────────────────────────────────────────────────
  const [accommodationText, setAccommodationText] = useState(day.accommodation ?? '');
  // Open AccommodationEditCard by default on a new day (no accommodation yet).
  // After the user closes or deletes it, isEditingAccommodation becomes false
  // and the "Add Accommodation" button is shown instead.
  const [isEditingAccommodation, setIsEditingAccommodation] = useState(!day.accommodation);
  const [accommodationLocationModalVisible, setAccommodationLocationModalVisible] = useState(false);
  const [accommodationBusy, setAccommodationBusy] = useState(false);

  useEffect(() => {
    setOrderedActivities(dayActivities);
  }, [dayActivities]);

  // ── Activity handlers ──────────────────────────────────────────────────────

  const startEdit = (act: Activity) => {
    setEditingId(act.id);
    setEditingName(act.name);
    setEditingActivityType(act.activityType ?? 'park');
    setEditingTimeValue(act.startTime ?? '');
    setEditingLocationText(act.locationText ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingActivityType('park');
    setEditingTimeValue('');
    setEditingLocationText('');
  };

  const handleEditSave = useCallback(async () => {
    if (!editingId || activityBusy) return;
    setActivityBusy(true);
    try {
      await onEditActivity(editingId, {
        name: editingName.trim() || undefined,
        activityType: editingActivityType,
        startTime: editingTimeValue || null,
        locationText: editingLocationText || null,
      });
      cancelEdit();
    } finally {
      setActivityBusy(false);
    }
  }, [editingId, editingName, editingActivityType, editingTimeValue, editingLocationText, activityBusy, onEditActivity]);

  const handleRemoveActivity = useCallback(
    async (activityId: string) => {
      if (activityBusy) return;
      setActivityBusy(true);
      try {
        await onRemoveActivity(activityId);
      } finally {
        setActivityBusy(false);
      }
    },
    [activityBusy, onRemoveActivity],
  );

  const handlePendingAdd = useCallback(async () => {
    if (activityBusy) return;
    setActivityBusy(true);
    try {
      await onAddActivity(day.id, {
        name: pendingName.trim() || 'Activity',
        activityType: pendingActivityType,
        startTime: pendingTimeValue || null,
        locationText: pendingLocationText || null,
      });
      setIsPendingNew(false);
      setPendingName('');
      setPendingActivityType('park');
      setPendingTimeValue('');
      setPendingLocationText('');
    } finally {
      setActivityBusy(false);
    }
  }, [activityBusy, day.id, onAddActivity, pendingName, pendingActivityType, pendingTimeValue, pendingLocationText]);

  const cancelPending = () => {
    setIsPendingNew(false);
    setPendingName('');
    setPendingActivityType('park');
    setPendingTimeValue('');
    setPendingLocationText('');
  };

  // ── Location modal handlers ────────────────────────────────────────────────

  const openLocationModal = useCallback(
    (actId: string | null, forPending: boolean, currentText: string) => {
      const fallback = baseLocation && baseLocation !== '—' ? baseLocation : '';
      setLocationModalActivityId(actId);
      setLocationModalForPending(forPending);
      setLocationModalInitialQuery(currentText || fallback);
      setLocationModalVisible(true);
    },
    [baseLocation],
  );

  const handleSelectLocation = useCallback(
    async (name: string, lat?: number | null, lng?: number | null) => {
      setLocationModalVisible(false);
      if (locationModalForPending) {
        setPendingLocationText(name || '');
        return;
      }
      const actId = locationModalActivityId;
      setLocationModalActivityId(null);
      if (!actId) return;
      if (actId === editingId) {
        setEditingLocationText(name || '');
        return;
      }
      if (!onUpdateActivityLocation) return;
      await onUpdateActivityLocation(actId, name || null, lat ?? null, lng ?? null);
    },
    [locationModalForPending, locationModalActivityId, editingId, onUpdateActivityLocation],
  );

  // ── Accommodation handlers ─────────────────────────────────────────────────

  const handleAccommodationSave = useCallback(async () => {
    if (accommodationBusy) return;
    setAccommodationBusy(true);
    try {
      await onUpdateDay(day.id, { accommodation: accommodationText || null });
      setIsEditingAccommodation(false);
    } finally {
      setAccommodationBusy(false);
    }
  }, [accommodationBusy, day.id, accommodationText, onUpdateDay]);

  const handleAccommodationDelete = useCallback(async () => {
    if (accommodationBusy) return;
    setAccommodationBusy(true);
    try {
      await onUpdateDay(day.id, { accommodation: null });
      setAccommodationText('');
      setIsEditingAccommodation(false);
    } finally {
      setAccommodationBusy(false);
    }
  }, [accommodationBusy, day.id, onUpdateDay]);

  // ── Time picker helpers ────────────────────────────────────────────────────

  const openTimePicker = (forPending: boolean) => {
    setTimePickerForPending(forPending);
    setTimePickerDate(new Date());
    setTimePickerVisible(true);
  };

  const applyPickedTime = (date: Date) => {
    const formatted = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (timePickerForPending) {
      setPendingTimeValue(formatted);
    } else {
      setEditingTimeValue(formatted);
    }
  };

  // ── Note save handler (passed to DayNoteSection) ───────────────────────────

  const handleNoteSave = useCallback(
    async (note: string | null) => {
      await onUpdateDay(day.id, { notes: note });
    },
    [day.id, onUpdateDay],
  );

  return (
    <View style={[styles.daySection, isDraggingDay && styles.daySectionDragging]}>
      {/* ── Controls row: drag handle + delete ──────────────────────────── */}
      <View style={styles.controlsRow}>
        {onDragDay && (
          <TouchableOpacity
            onLongPress={onDragDay}
            delayLongPress={200}
            hitSlop={6}
            style={styles.dayDragHandle}
          >
            <GripVertical size={18} color={secondary} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
        <View style={styles.spacer} />
        <TouchableOpacity
          onPress={() =>
            Alert.alert(
              'Delete day',
              'This will permanently delete this day and all its activities.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onRemoveDay(day.id) },
              ],
            )
          }
          hitSlop={8}
        >
          <Trash2 size={16} color={secondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* ── AccordionSection wraps the day body ─────────────────────────── */}
      <AccordionSection
        title={formatDayLabel(day.date, day.dayNumber)}
        collapsed={isCollapsed}
        onToggle={onToggle}
      >
        <View style={styles.dayBody}>
          {/* ── Accommodation ─────────────────────────────────────────── */}
          {isEditingAccommodation ? (
            <AccommodationEditCard
              selectedName={accommodationText}
              onPressSelect={() => setAccommodationLocationModalVisible(true)}
              onClose={() => setIsEditingAccommodation(false)}
              onDelete={handleAccommodationDelete}
              onSave={handleAccommodationSave}
            />
          ) : accommodationText ? (
            <AccommodationCard
              title={accommodationText}
              onPress={() => setIsEditingAccommodation(true)}
            />
          ) : (
            <AddAnotherActivityButton
              label="Add Accommodation"
              onPress={() => setIsEditingAccommodation(true)}
            />
          )}

          {/* ── Day note ──────────────────────────────────────────────── */}
          <DayNoteSection
            initialNote={day.notes}
            onSave={handleNoteSave}
          />

          {/* ── Activity list — only rendered when non-empty ───────────── */}
          {orderedActivities.length > 0 && (
            <DraggableFlatList
              data={orderedActivities}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              activationDistance={10}
              contentContainerStyle={{ gap: spacing.lg }}
              onDragEnd={({ data }) => {
                setOrderedActivities(data);
                onReorderActivities?.(day.id, data.map((a) => a.id));
              }}
              renderItem={({ item: act, drag }) =>
                editingId === act.id ? (
                  <ScaleDecorator activeScale={1.02}>
                    <ActivityEditCard
                      title={act.name || 'Edit Activity'}
                      name={editingName}
                      activityType={editingActivityType}
                      timeValue={editingTimeValue}
                      placeValue={editingLocationText}
                      onChangeName={setEditingName}
                      onChangeActivityType={setEditingActivityType}
                      onPressTime={() => openTimePicker(false)}
                      onPressPlace={() => openLocationModal(act.id, false, editingLocationText)}
                      onDelete={async () => {
                        await handleRemoveActivity(act.id);
                        cancelEdit();
                      }}
                      onSave={handleEditSave}
                      onClose={cancelEdit}
                    />
                  </ScaleDecorator>
                ) : (
                  <ScaleDecorator activeScale={1.02}>
                    <ActivityCard
                      title={act.name}
                      tags={[
                        ...(act.startTime ? [{ label: act.startTime, icon: 'time' as const }] : []),
                        ...(act.locationText ? [{ label: act.locationText, icon: 'location' as const }] : []),
                      ]}
                      onPress={() => startEdit(act)}
                      onPressEdit={() => startEdit(act)}
                      onMoveDown={drag}
                    />
                  </ScaleDecorator>
                )
              }
            />
          )}

          {/* ── Pending new activity ───────────────────────────────────── */}
          {isPendingNew && (
            <ActivityEditCard
              title="New Activity"
              name={pendingName}
              activityType={pendingActivityType}
              timeValue={pendingTimeValue}
              placeValue={pendingLocationText}
              onChangeName={setPendingName}
              onChangeActivityType={setPendingActivityType}
              onPressTime={() => openTimePicker(true)}
              onPressPlace={() => openLocationModal(null, true, pendingLocationText)}
              onDelete={cancelPending}
              onSave={handlePendingAdd}
              onClose={cancelPending}
            />
          )}

          {/* ── Add another activity button ────────────────────────────── */}
          {!isPendingNew && (
            <AddAnotherActivityButton onPress={() => setIsPendingNew(true)} />
          )}
        </View>

        {/* ── Time picker ───────────────────────────────────────────────── */}
        {timePickerVisible &&
          (Platform.OS === 'android' ? (
            <DateTimePicker
              value={timePickerDate}
              mode="time"
              display="default"
              onChange={(_, date) => {
                setTimePickerVisible(false);
                if (date) applyPickedTime(date);
              }}
            />
          ) : (
            <Modal
              transparent
              animationType="fade"
              onRequestClose={() => setTimePickerVisible(false)}
            >
              <TouchableOpacity
                style={styles.timePickerOverlay}
                activeOpacity={1}
                onPress={() => setTimePickerVisible(false)}
              >
                <View style={styles.timePickerSheet}>
                  <DateTimePicker
                    value={timePickerDate}
                    mode="time"
                    display="spinner"
                    onChange={(_, date) => {
                      if (date) setTimePickerDate(date);
                    }}
                  />
                  <TouchableOpacity
                    style={styles.timePickerConfirm}
                    onPress={() => {
                      applyPickedTime(timePickerDate);
                      setTimePickerVisible(false);
                    }}
                  >
                    <AppText style={styles.timePickerConfirmLabel}>Done</AppText>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          ))}
      </AccordionSection>

      {/* ── Activity location map modal ──────────────────────────────────── */}
      <LocationMapModal
        visible={locationModalVisible}
        initialQuery={locationModalInitialQuery}
        onSelect={handleSelectLocation}
        onClose={() => {
          setLocationModalVisible(false);
          setLocationModalActivityId(null);
          setLocationModalForPending(false);
        }}
        allowPointPick
      />

      {/* ── Accommodation location map modal ─────────────────────────────── */}
      <LocationMapModal
        visible={accommodationLocationModalVisible}
        initialQuery={baseLocation ?? ''}
        onSelect={(name) => {
          setAccommodationText(name || '');
          setAccommodationLocationModalVisible(false);
        }}
        onClose={() => setAccommodationLocationModalVisible(false)}
        allowPointPick
      />
    </View>
  );
}

const styles = StyleSheet.create({
  daySection: { marginBottom: spacing.xl },
  daySectionDragging: { opacity: 0.9 },

  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dayDragHandle: { marginRight: spacing.xs },
  spacer: { flex: 1 },

  // 16px gap between all components inside the accordion body
  dayBody: { gap: spacing.lg },

  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  timePickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  timePickerConfirm: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  timePickerConfirmLabel: {
    ...typography.base,
    fontWeight: typography.weights.semibold,
    color: '#007AFF',
  },
});
