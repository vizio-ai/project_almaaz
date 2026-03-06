import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AppText, PrimaryButton, useThemeColor, spacing, typography, radii } from '@shared/ui-kit';
import { LocationMapModal } from '../LocationMapModal';

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
  activities: WizardDraftActivity[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WizardTripPlanStepProps {
  days: WizardDraftDay[];
  onDaysChange: (days: WizardDraftDay[]) => void;
  onBack: () => void;
  onNext: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDayHeader(day: WizardDraftDay): string {
  if (!day.date) return `Day ${day.dayNumber}`;
  const d = new Date(day.date);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `Day ${day.dayNumber} · ${dayName}, ${dateStr}`;
}

function activityTypeLabel(type: WizardActivityType): string {
  switch (type) {
    case 'museum':   return 'Museum';
    case 'food':     return 'Food & Drink';
    case 'shopping': return 'Shopping';
    case 'historic': return 'Historic place';
    case 'beach':    return 'Beach';
    default:         return 'Park';
  }
}

const ACTIVITY_TYPES: WizardActivityType[] = ['park', 'museum', 'food', 'shopping', 'historic', 'beach'];

// ─── DayCard ─────────────────────────────────────────────────────────────────

interface DayCardProps {
  day: WizardDraftDay;
  onChange: (updated: WizardDraftDay) => void;
  onRemove: () => void;
  canRemove: boolean;
  onOpenPlaceModal: (activityId: string, currentPlace: string) => void;
  onOpenAccommodationModal: (dayId: string, currentAccommodation: string) => void;
  onOpenTimePicker: (activityId: string, currentTime: string) => void;
}

function DayCard({
  day,
  onChange,
  onRemove,
  canRemove,
  onOpenPlaceModal,
  onOpenAccommodationModal,
  onOpenTimePicker,
}: DayCardProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const border    = useThemeColor('border');

  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <View style={[styles.dayCard, { borderColor: border }]}>
      {/* ── Day header ─────────────────────────────────────────────── */}
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

      {/* ── Expanded body ───────────────────────────────────────────── */}
      {!collapsed && (
        <View style={styles.dayBody}>
          {/* Accommodation – tapping opens map with point pick */}
          <AppText style={[styles.fieldLabel, { color: textColor }]}>Accommodation</AppText>
          <TouchableOpacity
            style={[styles.inputBox, { borderColor: border }]}
            onPress={() => onOpenAccommodationModal(day.id, day.accommodation)}
            activeOpacity={0.7}
          >
            <Ionicons name="bed-outline" size={14} color={secondary} style={styles.inputIcon} />
            <AppText
              style={[styles.inputText, { color: day.accommodation ? textColor : secondary, flex: 1 }]}
              numberOfLines={1}
            >
              {day.accommodation || 'e.g. Hotel name or Airbnb'}
            </AppText>
            <Ionicons name="location-outline" size={14} color={secondary} />
          </TouchableOpacity>

          {/* ── Activities ─────────────────────────────────────────── */}
          {day.activities.map((act, actIndex) => (
            <View
              key={act.id}
              style={[styles.activityBlock, { borderTopColor: border }]}
            >
              {/* Activity header */}
              <View style={styles.activityHeaderRow}>
                <AppText style={[styles.fieldLabel, { color: textColor }]}>
                  Activity {actIndex + 1}
                </AppText>
                {day.activities.length > 1 && (
                  <TouchableOpacity onPress={() => removeActivity(act.id)} hitSlop={8}>
                    <Ionicons name="close" size={16} color={secondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Activity name */}
              <View style={[styles.inputBox, { borderColor: border }]}>
                <TextInput
                  style={[styles.inputText, { color: textColor, flex: 1 }]}
                  placeholder="e.g. Visit museum"
                  placeholderTextColor={secondary}
                  value={act.name}
                  onChangeText={(v) => updateActivity(act.id, { name: v })}
                />
              </View>

              {/* Activity type chips */}
              <AppText style={[styles.subFieldLabel, { color: secondary }]}>Activity type</AppText>
              <View style={styles.typeChips}>
                {ACTIVITY_TYPES.map((type) => {
                  const isActive = act.activityType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        { borderColor: border },
                        isActive && { backgroundColor: textColor, borderColor: textColor },
                      ]}
                      onPress={() => updateActivity(act.id, { activityType: isActive ? null : type })}
                      activeOpacity={0.7}
                    >
                      <AppText
                        style={[styles.typeChipLabel, { color: isActive ? '#FAFAFA' : secondary }]}
                      >
                        {activityTypeLabel(type)}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Time + Place row */}
              <View style={styles.timeAndPlaceRow}>
                {/* Time – tapping opens time picker */}
                <TouchableOpacity
                  style={[styles.inputBox, styles.timeBox, { borderColor: border }]}
                  onPress={() => onOpenTimePicker(act.id, act.time)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="time-outline"
                    size={13}
                    color={secondary}
                    style={styles.inputIcon}
                  />
                  <AppText
                    style={[styles.inputText, { color: act.time ? textColor : secondary, flex: 1 }]}
                    numberOfLines={1}
                  >
                    {act.time || '9:00 AM'}
                  </AppText>
                </TouchableOpacity>

                {/* Place – tapping opens map picker */}
                <TouchableOpacity
                  style={[styles.inputBox, styles.placeBox, { borderColor: border }]}
                  onPress={() => onOpenPlaceModal(act.id, act.place)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color={secondary}
                    style={styles.inputIcon}
                  />
                  <AppText
                    style={[styles.inputText, { color: act.place ? textColor : secondary, flex: 1 }]}
                    numberOfLines={1}
                  >
                    {act.place || 'Pick a location'}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Add another activity */}
          <TouchableOpacity onPress={addActivity} style={styles.addActivityLink}>
            <AppText style={[styles.addActivityLabel, { color: secondary }]}>
              + Add Another Activity
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
  const border     = useThemeColor('border');
  const textColor  = useThemeColor('text');
  const background = useThemeColor('background');
  const surface    = useThemeColor('surface');
  const accent     = useThemeColor('accent');

  // ── Activity place picker ────────────────────────────────────────────────
  const [placeModalVisible,      setPlaceModalVisible]      = useState(false);
  const [placeModalActivityId,   setPlaceModalActivityId]   = useState<string | null>(null);
  const [placeModalInitialQuery, setPlaceModalInitialQuery] = useState('');

  // ── Accommodation location picker ────────────────────────────────────────
  const [accommodationModalVisible,      setAccommodationModalVisible]      = useState(false);
  const [accommodationModalDayId,        setAccommodationModalDayId]        = useState<string | null>(null);
  const [accommodationModalInitialQuery, setAccommodationModalInitialQuery] = useState('');

  // ── Time picker ──────────────────────────────────────────────────────────
  const [timePickerActivityId, setTimePickerActivityId] = useState<string | null>(null);
  const [timePickerDate,       setTimePickerDate]       = useState<Date>(new Date());

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

  function handleSelectAccommodation(locationName: string) {
    if (!accommodationModalDayId) return;
    const targetDayId = accommodationModalDayId;
    onDaysChange(
      days.map((day) => (day.id === targetDayId ? { ...day, accommodation: locationName } : day)),
    );
    setAccommodationModalVisible(false);
    setAccommodationModalDayId(null);
  }

  // ── Time picker handlers ─────────────────────────────────────────────────

  function openTimePicker(activityId: string, currentTime: string) {
    // Pre-set picker to the existing time if parseable
    const defaultDate = new Date();
    if (currentTime) {
      const parsed = parseTimeString(currentTime, defaultDate);
      setTimePickerDate(parsed ?? defaultDate);
    } else {
      setTimePickerDate(defaultDate);
    }
    setTimePickerActivityId(activityId);
  }

  function handleConfirmTime() {
    if (!timePickerActivityId) return;
    const label = formatTimeLabel(timePickerDate);
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
    onDaysChange([
      ...days,
      {
        id: `draft-day-${Date.now()}`,
        dayNumber: days.length + 1,
        date: null,
        accommodation: '',
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
        {days.map((day) => (
          <DayCard
            key={day.id}
            day={day}
            onChange={(updated) => updateDay(day.id, updated)}
            onRemove={() => removeDay(day.id)}
            canRemove={days.length > 1}
            onOpenPlaceModal={openPlaceModal}
            onOpenAccommodationModal={openAccommodationModal}
            onOpenTimePicker={openTimePicker}
          />
        ))}

        {/* Add Another Day */}
        <TouchableOpacity
          onPress={addDay}
          style={[styles.addDayBtn, { borderColor: border }]}
        >
          <Ionicons name="add-outline" size={16} color={textColor} />
          <AppText style={[styles.addDayLabel, { color: textColor }]}>Add Another Day</AppText>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom action bar */}
      <View style={[styles.bottomBar, { borderTopColor: border, backgroundColor: background }]}>
        <PrimaryButton variant="outline" label="Back" onPress={onBack} style={styles.actionBtn} />
        <PrimaryButton label="Next" onPress={onNext} style={styles.actionBtn} />
      </View>

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

      {/* Accommodation location picker (also allows pin) */}
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

      {/* Time picker – iOS spinner / Android default */}
      {timePickerActivityId &&
        (Platform.OS === 'android' ? (
          <DateTimePicker
            value={timePickerDate}
            mode="time"
            display="default"
            onChange={(_, date) => {
              if (!date) { setTimePickerActivityId(null); return; }
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
            }}
          />
        ) : (
          <Modal visible transparent animationType="none" onRequestClose={() => setTimePickerActivityId(null)}>
            <View style={styles.timeOverlay}>
              <TouchableOpacity
                style={styles.timeScrim}
                activeOpacity={1}
                onPress={() => setTimePickerActivityId(null)}
              />
              <View style={[styles.timeSheet, { backgroundColor: surface }]}>
                <AppText style={[styles.timeTitle, { color: textColor }]}>Select time</AppText>
                <DateTimePicker
                  value={timePickerDate}
                  mode="time"
                  display="spinner"
                  onChange={(_, date) => {
                    if (date) setTimePickerDate(date);
                  }}
                />
                <View style={styles.timeActions}>
                  <TouchableOpacity
                    onPress={() => setTimePickerActivityId(null)}
                    style={styles.timeCancelBtn}
                  >
                    <AppText style={[styles.timeCancelLabel, { color: textColor }]}>Cancel</AppText>
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
    </KeyboardAvoidingView>
  );
}

// ─── Time helpers ─────────────────────────────────────────────────────────────

function formatTimeLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function parseTimeString(timeStr: string, base: Date): Date | null {
  // Try to parse "9:00 AM" / "12:30 PM" style strings
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },

  // Day card
  dayCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dayTitle: { ...typography.sm, fontWeight: '600', flex: 1 },
  dayHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  // Day body
  dayBody: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md },

  // Fields
  fieldLabel:    { ...typography.sm, fontWeight: '500', marginBottom: spacing.xs },
  subFieldLabel: { ...typography.caption, marginBottom: 4 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  inputIcon: { marginRight: spacing.xs },
  inputText:  { ...typography.sm },

  // Activity type chips
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  typeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  typeChipLabel: { ...typography.xs, fontWeight: '500' },

  // Activity block
  activityBlock: { gap: spacing.sm, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  activityHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Time + place row
  timeAndPlaceRow: { flexDirection: 'row', gap: spacing.sm },
  timeBox:  { flex: 1 },
  placeBox: { flex: 2 },

  // Add activity link
  addActivityLink:  { paddingVertical: spacing.sm, alignItems: 'center' },
  addActivityLabel: { ...typography.sm, textDecorationLine: 'underline' },

  // Add another day button
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  addDayLabel: { ...typography.sm, fontWeight: '500' },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: { flex: 1 },

  // Time picker modal (iOS)
  timeOverlay: { flex: 1, justifyContent: 'flex-end' },
  timeScrim:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  timeSheet: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: 32,
    paddingTop: spacing.lg,
  },
  timeTitle:  { ...typography.sm, textAlign: 'center', marginBottom: spacing.xs },
  timeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  timeCancelBtn:    { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  timeCancelLabel:  { ...typography.base },
  timeConfirmBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  timeConfirmLabel: { ...typography.base, fontWeight: '600', color: '#fff' },
});
