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
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor, spacing, typography, radii } from '@shared/ui-kit';
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
  const secondary = useThemeColor('textSecondary');

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
      {/* ── Day header (Figma accordiontrigger) ─────────────────────── */}
      <TouchableOpacity
        style={styles.dayHeader}
        onPress={() => setCollapsed((c) => !c)}
        activeOpacity={0.7}
      >
        <AppText style={styles.dayTitle}>
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

      {/* ── Expanded body (Figma frameWrapper + selectParent) ───────── */}
      {!collapsed && (
        <View style={styles.dayBody}>
          {/* Accommodation (Figma selecttrigger) */}
          <AppText style={styles.fieldLabel}>Accommodation</AppText>
          <TouchableOpacity
            style={styles.selectTrigger}
            onPress={() => onOpenAccommodationModal(day.id, day.accommodation)}
            activeOpacity={0.7}
          >
            <AppText
              style={[styles.placeholderText, day.accommodation && styles.placeholderTextFilled]}
              numberOfLines={1}
            >
              {day.accommodation || 'Choose an accommodation'}
            </AppText>
            <Ionicons name="chevron-down" size={16} color={secondary} />
          </TouchableOpacity>

          {/* ── Activities (Figma: Activity Name, Time, Place) ───────── */}
          {day.activities.map((act, actIndex) => (
            <View key={act.id} style={styles.activityBlock}>
              <View style={styles.activityHeaderRow}>
                <AppText style={[styles.fieldLabel, styles.activityHeaderLabel]}>Activity Name</AppText>
                {day.activities.length > 1 && (
                  <TouchableOpacity onPress={() => confirmRemoveActivity(act.id)} hitSlop={8}>
                    <Ionicons name="close" size={16} color={secondary} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ height: 8 }} />
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.inputText}
                  placeholder="John Doe"
                  placeholderTextColor="#71717a"
                  value={act.name}
                  onChangeText={(v) => updateActivity(act.id, { name: v })}
                />
              </View>

              {/* Activity type chips (kept per user) */}
              <View style={{ height: 16 }} />
              <AppText style={styles.fieldLabel}>Activity type</AppText>
              <View style={styles.typeChips}>
                {ACTIVITY_TYPES.map((type) => {
                  const isActive = act.activityType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        isActive && styles.typeChipActive,
                      ]}
                      onPress={() => updateActivity(act.id, { activityType: isActive ? null : type })}
                      activeOpacity={0.7}
                    >
                      <AppText
                        style={[styles.typeChipLabel, isActive && styles.typeChipLabelActive]}
                      >
                        {activityTypeLabel(type)}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Time + Place row (Figma datePickerParent) */}
              <View style={{ height: 16 }} />
              <View style={styles.timeAndPlaceRow}>
                <View style={styles.datePicker}>
                  <AppText style={styles.fieldLabel}>Time</AppText>
                  <TouchableOpacity
                    style={styles.datePickerTrigger}
                    onPress={() => onOpenTimePicker(act.id, act.time)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="time-outline" size={16} color={secondary} />
                    <AppText
                      style={[styles.placeholderText, act.time && styles.placeholderTextFilled]}
                      numberOfLines={1}
                    >
                      {act.time || '9:00 AM'}
                    </AppText>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePicker2}>
                  <AppText style={styles.fieldLabel}>Place</AppText>
                  <TouchableOpacity
                    style={styles.datePickerTrigger2}
                    onPress={() => onOpenPlaceModal(act.id, act.place)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="location-outline" size={16} color={secondary} />
                    <AppText
                      style={[styles.placeholderText, act.place && styles.placeholderTextFilled]}
                      numberOfLines={1}
                    >
                      {act.place || 'Pick a location'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Add Another Activity (Figma button6/7) */}
          <View style={{ height: 16 }} />
          <TouchableOpacity onPress={addActivity} style={styles.addActivityLink}>
            <AppText style={styles.addActivityLabel}>Add Another Activity</AppText>
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
  const textColor = useThemeColor('text');
  const surface  = useThemeColor('surface');
  const accent    = useThemeColor('accent');

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
        style={styles.scrollView}
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

        {/* Add Another Day (Figma button8) */}
        <TouchableOpacity onPress={addDay} style={styles.addDayBtn}>
          <AppText style={styles.addDayLabel}>Add Another Day</AppText>
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

      {/* Accommodation location picker (name only, no point pick) */}
      <LocationMapModal
        visible={accommodationModalVisible}
        initialQuery={accommodationModalInitialQuery}
        onSelect={handleSelectAccommodation}
        onClose={() => {
          setAccommodationModalVisible(false);
          setAccommodationModalDayId(null);
        }}
        allowPointPick={false}
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
  scrollView: { flex: 1, backgroundColor: '#fff' },

  // Figma form9 – label↔input 8px, other vertical 16px
  content: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 16,
  },

  // Section label (Figma tripPlan)
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#171717',
  },

  // Day card (Figma accordionAccordionitem)
  dayCard: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    paddingHorizontal: 0,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181b',
    flex: 1,
  },
  dayHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },

  // Day body (Figma frameWrapper)
  dayBody: {
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },

  // Fields (Figma labelTypo – no lineHeight)
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#18181b',
    marginBottom: 8,
  },
  subFieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#71717a',
    marginBottom: 8,
  },

  // Accommodation trigger (Figma selecttrigger)
  selectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 6,
    elevation: 2,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  placeholderText: {
    fontSize: 14,
    color: '#71717a',
    flex: 1,
  },
  placeholderTextFilled: {
    color: '#18181b',
  },

  // Activity name input (Figma input)
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 6,
    elevation: 2,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
  },
  inputText: {
    fontSize: 14,
    color: '#18181b',
    flex: 1,
  },

  // Activity type chips
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  typeChipActive: {
    backgroundColor: '#18181b',
    borderColor: '#18181b',
  },
  typeChipLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717a',
  },
  typeChipLabelActive: {
    color: '#fafafa',
  },

  // Activity block
  activityBlock: { paddingTop: 16 },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityHeaderLabel: { marginBottom: 0 },

  // Time + Place (Figma datePickerParent)
  timeAndPlaceRow: { flexDirection: 'row', gap: 8 },
  datePicker: { width: 105, },
  datePicker2: { flex: 1,  },
  datePickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
    alignSelf: 'stretch',
  },
  datePickerTrigger2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 16,
    paddingVertical: 8,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    shadowOpacity: 1,
    alignSelf: 'stretch',
  },

  // Add Another Activity (Figma button6/7)
  addActivityLink: {
    height: 32,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addActivityLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0a0a0a',
  },

  // Add Another Day (Figma button8)
  addDayBtn: {
    height: 40,
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#fff',
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
    fontSize: 14,
    fontWeight: '500',
    color: '#18181b',
  },

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
