import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  AppInput,
  SelectTrigger,
  FilterChipGroup,
  TimePickerBottomSheet,
  useThemeColor,
  spacing,
  typography,
  radii,
  type FilterChipOption,
} from '@shared/ui-kit';
import { LocationMapModal } from '../LocationMapModal';
import { WizardBottomActionBar } from './WizardBottomActionBar';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WizardActivityType = 'park' | 'museum' | 'food' | 'shopping' | 'historic' | 'beach';

export interface WizardDraftActivity {
  id: string;
  name: string;
  time: string;
  place: string;
  latitude: number | null;
  longitude: number | null;
  activityType: WizardActivityType | null;
}

export interface WizardDraftDay {
  id: string;
  dayNumber: number;
  date: string | null;
  accommodation: string;
  accommodationLatitude: number | null;
  accommodationLongitude: number | null;
  activities: WizardDraftActivity[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WizardTripPlanStepProps {
  days: WizardDraftDay[];
  onDaysChange: (days: WizardDraftDay[]) => void;
  onBack: () => void;
  onNext: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_TYPE_OPTIONS: FilterChipOption<WizardActivityType>[] = [
  { value: 'park',     label: 'Park' },
  { value: 'museum',   label: 'Museum' },
  { value: 'food',     label: 'Food & Drink' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'historic', label: 'Historic place' },
  { value: 'beach',    label: 'Beach' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDayHeader(day: WizardDraftDay): string {
  if (!day.date) return `Day ${day.dayNumber}`;
  const d = new Date(day.date);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `Day ${day.dayNumber} · ${dayName}, ${dateStr}`;
}

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function parseTimeString(timeStr: string, base: Date): Date | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  const result = new Date(base);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

// ─── DayCard ──────────────────────────────────────────────────────────────────

interface DayCardProps {
  day: WizardDraftDay;
  onChange: (updated: WizardDraftDay) => void;
  onRemove: () => void;
  canRemove: boolean;
  initialCollapsed?: boolean;
  onOpenPlaceModal: (activityId: string, currentPlace: string) => void;
  onOpenAccommodationModal: (dayId: string, currentAccommodation: string) => void;
  onOpenTimePicker: (activityId: string, currentTime: string) => void;
}

function DayCard({
  day,
  onChange,
  onRemove,
  canRemove,
  initialCollapsed = false,
  onOpenPlaceModal,
  onOpenAccommodationModal,
  onOpenTimePicker,
}: DayCardProps) {
  const textColor  = useThemeColor('text');
  const subTextColor = useThemeColor('subText');
  const secondary  = useThemeColor('textSecondary');
  const borderMuted = useThemeColor('borderMuted');

  const [collapsed, setCollapsed] = useState(initialCollapsed);

  function addActivity() {
    const newAct: WizardDraftActivity = {
      id: `draft-act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: '',
      time: '',
      place: '',
      latitude: null,
      longitude: null,
      activityType: null,
    };
    onChange({ ...day, activities: [...day.activities, newAct] });
  }

  function updateActivity(id: string, patch: Partial<WizardDraftActivity>) {
    onChange({
      ...day,
      activities: day.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  }

  function removeActivity(id: string) {
    onChange({ ...day, activities: day.activities.filter((a) => a.id !== id) });
  }

  function confirmRemoveActivity(actId: string) {
    Alert.alert(
      'Remove activity',
      'Are you sure you want to remove this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeActivity(actId) },
      ],
    );
  }

  return (
    <View style={styles.dayCard}>
      {/* ── Day header ────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.dayHeader}
        onPress={() => setCollapsed((c) => !c)}
        activeOpacity={0.7}
      >
        <AppText style={[styles.dayTitle, { color: textColor }]}>
          {formatDayHeader(day)}
        </AppText>
        <View style={styles.dayHeaderRight}>
          {canRemove && (
            <TouchableOpacity onPress={onRemove} hitSlop={8}>
              <Ionicons name="trash-outline" size={16} color={secondary} />
            </TouchableOpacity>
          )}
          <Ionicons
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={18}
            color={secondary}
          />
        </View>
      </TouchableOpacity>

      {/* ── Expanded body ─────────────────────────────────────────────── */}
      {!collapsed && (
        <View style={styles.dayBody}>
          {/* Accommodation */}
          <AppText style={[styles.fieldLabel, { color: textColor }]}>Accommodation</AppText>
          <View style={{ height: 8 }} />
          <SelectTrigger
            value={day.accommodation}
            placeholder="Choose an accommodation"
            onPress={() => onOpenAccommodationModal(day.id, day.accommodation)}
          />

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: borderMuted }]} />

          {/* ── Activities ────────────────────────────────────────────── */}
          {day.activities.map((act) => (
            <View key={act.id} style={styles.activityBlock}>
              <View style={styles.activityHeaderRow}>
                <AppText style={[styles.fieldLabel, { color: textColor }]}>Activity Name</AppText>
                {day.activities.length > 1 && (
                  <TouchableOpacity onPress={() => confirmRemoveActivity(act.id)} hitSlop={8}>
                    <Ionicons name="close" size={16} color={secondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ height: 8 }} />
              <AppInput
                value={act.name}
                onChangeText={(v) => updateActivity(act.id, { name: v })}
                placeholder="e. g. Visit the Eiffel Tower"
              />

              {/* Activity type */}
              <View style={{ height: 16 }} />
              <AppText style={[styles.fieldLabel, { color: textColor }]}>Activity type</AppText>
              <View style={{ height: 8 }} />
              <FilterChipGroup
                options={ACTIVITY_TYPE_OPTIONS}
                value={act.activityType}
                onChange={(type) => updateActivity(act.id, { activityType: type })}
                allowDeselect
              />

              {/* Time + Place */}
              <View style={{ height: 16 }} />
              <View style={styles.timeAndPlaceRow}>
                <View style={styles.timeCol}>
                  <AppText style={[styles.fieldLabel, { color: textColor }]}>Time</AppText>
                  <View style={{ height: 8 }} />
                  <SelectTrigger
                    value={act.time}
                    placeholder="9:00 AM"
                    onPress={() => onOpenTimePicker(act.id, act.time)}
                    leftIcon="time-outline"
                    hideRightChevron
                  />
                </View>
                <View style={styles.placeCol}>
                  <AppText style={[styles.fieldLabel, { color: textColor }]}>Place</AppText>
                  <View style={{ height: 8 }} />
                  <SelectTrigger
                    value={act.place}
                    placeholder="Pick a location"
                    onPress={() => onOpenPlaceModal(act.id, act.place)}
                    leftIcon="location-outline"
                    hideRightChevron
                  />
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: borderMuted }]} />
            </View>
          ))}

          {/* Add Another Activity */}
          <View style={{ height: 16 }} />
          <TouchableOpacity onPress={addActivity} style={styles.addActivityBtn}>
            <AppText style={[styles.addActivityLabel, { color: textColor }]}>
              Add Another Activity
            </AppText>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main step component ──────────────────────────────────────────────────────

export function WizardTripPlanStep({
  days,
  onDaysChange,
  onBack,
  onNext,
}: WizardTripPlanStepProps) {
  const background = useThemeColor('background');
  const textColor  = useThemeColor('text');
  const border     = useThemeColor('borderMuted');

  // ── Activity place picker ────────────────────────────────────────────────
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const [placeModalActivityId, setPlaceModalActivityId] = useState<string | null>(null);
  const [placeModalInitialQuery, setPlaceModalInitialQuery] = useState('');

  // ── Accommodation location picker ────────────────────────────────────────
  const [accommodationModalVisible, setAccommodationModalVisible] = useState(false);
  const [accommodationModalDayId, setAccommodationModalDayId] = useState<string | null>(null);
  const [accommodationModalInitialQuery, setAccommodationModalInitialQuery] = useState('');

  // ── Time picker ──────────────────────────────────────────────────────────
  const [timePickerActivityId, setTimePickerActivityId] = useState<string | null>(null);
  const [timePickerDate, setTimePickerDate] = useState<Date>(new Date());

  // ── Location handlers ────────────────────────────────────────────────────

  function openPlaceModal(activityId: string, currentPlace: string) {
    setPlaceModalActivityId(activityId);
    setPlaceModalInitialQuery(currentPlace);
    setPlaceModalVisible(true);
  }

  function handleSelectPlace(locationName: string, lat?: number | null, lng?: number | null) {
    if (!placeModalActivityId) return;
    const actId = placeModalActivityId;
    onDaysChange(
      days.map((day) => ({
        ...day,
        activities: day.activities.map((act) =>
          act.id === actId
            ? { ...act, place: locationName, latitude: lat ?? null, longitude: lng ?? null }
            : act,
        ),
      })),
    );
    setPlaceModalVisible(false);
    setPlaceModalActivityId(null);
  }

  function openAccommodationModal(dayId: string, currentAccommodation: string) {
    setAccommodationModalDayId(dayId);
    setAccommodationModalInitialQuery(currentAccommodation);
    setAccommodationModalVisible(true);
  }

  function handleSelectAccommodation(locationName: string, lat?: number | null, lng?: number | null) {
    if (!accommodationModalDayId) return;
    const targetDayId = accommodationModalDayId;
    onDaysChange(
      days.map((day) =>
        day.id === targetDayId
          ? { ...day, accommodation: locationName, accommodationLatitude: lat ?? null, accommodationLongitude: lng ?? null }
          : day,
      ),
    );
    setAccommodationModalVisible(false);
    setAccommodationModalDayId(null);
  }

  // ── Time picker handlers ─────────────────────────────────────────────────

  function openTimePicker(activityId: string, currentTime: string) {
    const defaultDate = new Date();
    if (currentTime) {
      const parsed = parseTimeString(currentTime, defaultDate);
      setTimePickerDate(parsed ?? defaultDate);
    } else {
      setTimePickerDate(defaultDate);
    }
    setTimePickerActivityId(activityId);
  }

  function handleConfirmTime(date: Date) {
    const label = formatTimeLabel(date);
    const actId = timePickerActivityId;
    onDaysChange(
      days.map((day) => ({
        ...day,
        activities: day.activities.map((act) =>
          act.id === actId ? { ...act, time: label } : act,
        ),
      })),
    );
    setTimePickerActivityId(null);
  }

  // ── Day handlers ─────────────────────────────────────────────────────────

  function updateDay(id: string, updated: WizardDraftDay) {
    onDaysChange(days.map((d) => (d.id === id ? updated : d)));
  }

  function removeDay(id: string) {
    const filtered = days.filter((d) => d.id !== id);
    onDaysChange(filtered.map((d, i) => ({ ...d, dayNumber: i + 1 })));
  }

  function addDay() {
    const lastDay = days[days.length - 1];
    let newDate: string | null = null;
    if (lastDay?.date) {
      const d = new Date(lastDay.date);
      d.setUTCDate(d.getUTCDate() + 1);
      newDate = d.toISOString().split('T')[0];
    }

    onDaysChange([
      ...days,
      {
        id: `draft-day-${Date.now()}`,
        dayNumber: days.length + 1,
        date: newDate,
        accommodation: '',
        accommodationLatitude: null,
        accommodationLongitude: null,
        activities: [
          {
            id: `draft-act-${Date.now()}`,
            name: '',
            time: '',
            place: '',
            latitude: null,
            longitude: null,
            activityType: null,
          },
        ],
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: background }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {days.map((day, index) => (
          <DayCard
            key={day.id}
            day={day}
            onChange={(updated) => updateDay(day.id, updated)}
            onRemove={() => removeDay(day.id)}
            canRemove={days.length > 1}
            initialCollapsed={index > 0 && days.length > 1}
            onOpenPlaceModal={openPlaceModal}
            onOpenAccommodationModal={openAccommodationModal}
            onOpenTimePicker={openTimePicker}
          />
        ))}

        {/* Add Another Day */}
        <TouchableOpacity
          onPress={addDay}
          style={[styles.addDayBtn, { borderColor: border, backgroundColor: background }]}
        >
          <AppText style={[styles.addDayLabel, { color: textColor }]}>Add Another Day</AppText>
        </TouchableOpacity>
      </ScrollView>

      <WizardBottomActionBar
        leftLabel="Back"
        onLeftPress={onBack}
        rightLabel="Next"
        onRightPress={onNext}
      />

      {/* Activity place picker (exact point pick) */}
      <LocationMapModal
        visible={placeModalVisible}
        initialQuery={placeModalInitialQuery}
        onSelect={handleSelectPlace}
        onClose={() => {
          setPlaceModalVisible(false);
          setPlaceModalActivityId(null);
        }}
        allowPointPick
      />

      {/* Accommodation location picker (with point pick) */}
      <LocationMapModal
        visible={accommodationModalVisible}
        initialQuery={accommodationModalInitialQuery}
        onSelect={handleSelectAccommodation}
        onClose={() => {
          setAccommodationModalVisible(false);
          setAccommodationModalDayId(null);
        }}
        allowPointPick
      />

      {/* Time picker bottom sheet */}
      <TimePickerBottomSheet
        visible={!!timePickerActivityId}
        value={timePickerDate}
        onConfirm={handleConfirmTime}
        onCancel={() => setTimePickerActivityId(null)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  content: {
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing['2xl'],
    gap: spacing.lg,
  },

  // Day card
  dayCard: {
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  dayTitle: {
    ...typography.sm,
    fontWeight: '500',
    flex: 1,
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },

  // Day body
  dayBody: {
    paddingVertical: spacing.lg,
  },

  // Field label
  fieldLabel: {
    ...typography.sm,
    fontWeight: '500',
  },

  // Divider
  divider: {
    height: 1,
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },

  // Activity
  activityBlock: { paddingTop: spacing.lg },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // Time + Place row
  timeAndPlaceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeCol: { width: 105 },
  placeCol: { flex: 1 },

  // Add Another Activity link
  addActivityBtn: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addActivityLabel: {
    ...typography.xs,
    fontWeight: '500',
  },

  // Add Another Day button
  addDayBtn: {
    height: 40,
    paddingHorizontal: spacing['3xl'],
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  addDayLabel: {
    ...typography.sm,
    fontWeight: '500',
  },
});
