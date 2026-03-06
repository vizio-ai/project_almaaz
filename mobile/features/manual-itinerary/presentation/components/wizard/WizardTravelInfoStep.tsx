import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  AppInput,
  FilterChipGroup,
  useThemeColor,
  spacing,
  typography,
  radii,
  type FilterChipOption,
} from '@shared/ui-kit';
import { WizardBottomActionBar } from './WizardBottomActionBar';
import type { TravelInfoType } from '../../../domain/entities/TravelInfo';

// ─── Draft type ────────────────────────────────────────────────────────────────

export interface WizardDraftTravelInfo {
  id: string;
  type: TravelInfoType;
  title: string;
  provider: string | null;
  detail: string | null;
  startDatetime: string | null;
  endDatetime: string | null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WizardTravelInfoStepProps {
  travelInfoItems: WizardDraftTravelInfo[];
  onTravelInfoChange: (items: WizardDraftTravelInfo[]) => void;
  onBack: () => void;
  onNext: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: FilterChipOption<TravelInfoType>[] = [
  { label: 'Flight',      value: 'flight',     icon: 'airplane-outline'      },
  { label: 'Rental Car',  value: 'rental_car', icon: 'car-outline'           },
  { label: 'Other',       value: 'other',      icon: 'document-text-outline' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTimeLabel(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${String(d.getFullYear())} · ${hours}:${minutes} ${ampm}`;
}

function titlePlaceholder(type: TravelInfoType): string {
  if (type === 'flight')     return 'e.g. JFK → LHR';
  if (type === 'rental_car') return 'e.g. Car pickup – Hertz';
  return 'e.g. Train ticket';
}

function providerPlaceholder(type: TravelInfoType): string {
  if (type === 'flight')     return 'e.g. American Airlines';
  if (type === 'rental_car') return 'e.g. Hertz';
  return 'e.g. Eurostar';
}

function detailPlaceholder(type: TravelInfoType): string {
  if (type === 'flight')     return 'e.g. PNR: ABC123 / Seat 14A';
  if (type === 'rental_car') return 'e.g. Pickup Apr 2 → Drop Apr 7';
  return 'e.g. Booking ref: XYZ';
}

function startDateLabel(type: TravelInfoType): string {
  if (type === 'flight')     return 'Departure date & time';
  if (type === 'rental_car') return 'Pickup date & time';
  return 'Date & time';
}

function endDateLabel(type: TravelInfoType): string {
  if (type === 'rental_car') return 'Drop-off date & time';
  return 'End date & time';
}

// ─── TransportCard ────────────────────────────────────────────────────────────

interface TransportCardProps {
  item: WizardDraftTravelInfo;
  index: number;
  canRemove: boolean;
  onChange: (updated: WizardDraftTravelInfo) => void;
  onRemove: () => void;
  onOpenStartPicker: (id: string, current: string | null) => void;
  onOpenEndPicker: (id: string, current: string | null) => void;
}

function TransportCard({
  item,
  index,
  canRemove,
  onChange,
  onRemove,
  onOpenStartPicker,
  onOpenEndPicker,
}: TransportCardProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const border    = useThemeColor('border');
  const surface   = useThemeColor('surface');
  const accent    = useThemeColor('accent');

  const [collapsed, setCollapsed] = useState(false);

  const showEndDate = item.type === 'rental_car';

  return (
    <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
      {/* ── Card header ─────────────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => setCollapsed((c) => !c)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeaderLeft}>
          <Ionicons
            name={TYPE_OPTIONS.find((t) => t.value === item.type)?.icon ?? 'document-text-outline'}
            size={16}
            color={textColor}
          />
          <AppText style={[styles.cardTitle, { color: textColor }]}>
            {item.title.trim() || `Transportation ${index + 1}`}
          </AppText>
        </View>
        <View style={styles.cardHeaderRight}>
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

      {!collapsed && (
        <View style={styles.cardBody}>
          {/* ── Type chips ─────────────────────────────────────────── */}
          <FilterChipGroup
            options={TYPE_OPTIONS}
            value={item.type}
            onChange={(type) => type && onChange({ ...item, type })}
            style={styles.typeRow}
          />

          {/* ── Title ──────────────────────────────────────────────── */}
          <AppInput
            label="Title *"
            value={item.title}
            onChangeText={(v) => onChange({ ...item, title: v })}
            placeholder={titlePlaceholder(item.type)}
            returnKeyType="next"
          />

          {/* ── Provider ───────────────────────────────────────────── */}
          <AppInput
            label={item.type === 'flight' ? 'Airline / Provider' : 'Provider'}
            value={item.provider ?? ''}
            onChangeText={(v) => onChange({ ...item, provider: v || null })}
            placeholder={providerPlaceholder(item.type)}
            returnKeyType="next"
          />

          {/* ── Detail ─────────────────────────────────────────────── */}
          <AppInput
            label="Reference / Detail"
            value={item.detail ?? ''}
            onChangeText={(v) => onChange({ ...item, detail: v || null })}
            placeholder={detailPlaceholder(item.type)}
            returnKeyType="next"
          />

          {/* ── Start date ─────────────────────────────────────────── */}
          <View style={styles.fieldWrap}>
            <AppText style={[styles.fieldLabel, { color: textColor }]}>
              {startDateLabel(item.type)}
            </AppText>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={[styles.dateBtn, { borderColor: border }]}
                onPress={() => onOpenStartPicker(item.id, item.startDatetime)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={15} color={secondary} />
                <AppText
                  style={[styles.dateBtnLabel, {
                    color: item.startDatetime ? textColor : secondary,
                    flex: 1,
                  }]}
                  numberOfLines={1}
                >
                  {formatDateTimeLabel(item.startDatetime) || 'Pick date & time'}
                </AppText>
              </TouchableOpacity>
              {item.startDatetime ? (
                <TouchableOpacity
                  onPress={() => onChange({ ...item, startDatetime: null })}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle" size={18} color={secondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* ── End date (rental car only) ─────────────────────────── */}
          {showEndDate && (
            <View style={styles.fieldWrap}>
              <AppText style={[styles.fieldLabel, { color: textColor }]}>
                {endDateLabel(item.type)}
              </AppText>
              <View style={styles.dateRow}>
                <TouchableOpacity
                  style={[styles.dateBtn, { borderColor: border }]}
                  onPress={() => onOpenEndPicker(item.id, item.endDatetime)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={15} color={secondary} />
                  <AppText
                    style={[styles.dateBtnLabel, {
                      color: item.endDatetime ? textColor : secondary,
                      flex: 1,
                    }]}
                    numberOfLines={1}
                  >
                    {formatDateTimeLabel(item.endDatetime) || 'Pick date & time'}
                  </AppText>
                </TouchableOpacity>
                {item.endDatetime ? (
                  <TouchableOpacity
                    onPress={() => onChange({ ...item, endDatetime: null })}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={18} color={secondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main step component ──────────────────────────────────────────────────────

export function WizardTravelInfoStep({
  travelInfoItems,
  onTravelInfoChange,
  onBack,
  onNext,
}: WizardTravelInfoStepProps) {
  const border     = useThemeColor('border');
  const textColor  = useThemeColor('text');
  const secondary  = useThemeColor('textSecondary');
  const background = useThemeColor('background');
  const surface    = useThemeColor('surface');
  const accent     = useThemeColor('accent');

  // ── DateTime picker state ────────────────────────────────────────────────
  const [pickerVisible,   setPickerVisible]   = useState(false);
  const [pickerItemId,    setPickerItemId]    = useState<string | null>(null);
  const [pickerField,     setPickerField]     = useState<'start' | 'end'>('start');
  const [pickerDate,      setPickerDate]      = useState<Date>(new Date());

  function openPicker(id: string, field: 'start' | 'end', current: string | null) {
    const init = current ? new Date(current) : new Date();
    setPickerDate(Number.isNaN(init.getTime()) ? new Date() : init);
    setPickerItemId(id);
    setPickerField(field);
    setPickerVisible(true);
  }

  function handleConfirmPicker() {
    if (!pickerItemId) return;
    const iso = pickerDate.toISOString();
    const key = pickerItemId;
    onTravelInfoChange(
      travelInfoItems.map((item) =>
        item.id === key
          ? pickerField === 'start'
            ? { ...item, startDatetime: iso }
            : { ...item, endDatetime: iso }
          : item,
      ),
    );
    setPickerVisible(false);
    setPickerItemId(null);
  }

  // ── Item CRUD ────────────────────────────────────────────────────────────

  function updateItem(id: string, updated: WizardDraftTravelInfo) {
    onTravelInfoChange(travelInfoItems.map((t) => (t.id === id ? updated : t)));
  }

  function removeItem(id: string) {
    onTravelInfoChange(travelInfoItems.filter((t) => t.id !== id));
  }

  function addItem() {
    onTravelInfoChange([
      ...travelInfoItems,
      {
        id:            `draft-ti-${Date.now()}`,
        type:          'flight',
        title:         '',
        provider:      null,
        detail:        null,
        startDatetime: null,
        endDatetime:   null,
      },
    ]);
  }

  const isEmpty = travelInfoItems.length === 0;

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
        {isEmpty ? (
          /* ── Empty state: explicit add button, no ghost card ──────── */
          <View style={styles.emptyState}>
            <AppText style={[styles.emptyTitle, { color: textColor }]}>
              Transportation & Bookings
            </AppText>
            <AppText style={[styles.emptyHint, { color: secondary }]}>
              Add flights, rental cars, or other travel bookings. You can skip this step if not needed.
            </AppText>
            <TouchableOpacity
              onPress={addItem}
              style={[styles.addBtn, { borderColor: border }]}
            >
              <Ionicons name="add-outline" size={16} color={textColor} />
              <AppText style={[styles.addBtnLabel, { color: textColor }]}>
                Add Transportation
              </AppText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {travelInfoItems.map((item, index) => (
              <TransportCard
                key={item.id}
                item={item}
                index={index}
                canRemove={true}
                onChange={(updated) => updateItem(item.id, updated)}
                onRemove={() => removeItem(item.id)}
                onOpenStartPicker={(id, current) => openPicker(id, 'start', current)}
                onOpenEndPicker={(id, current) => openPicker(id, 'end', current)}
              />
            ))}

            {/* ── Add Another Transportation ─────────────────────────── */}
            <TouchableOpacity
              onPress={addItem}
              style={[styles.addBtn, { borderColor: border }]}
            >
              <Ionicons name="add-outline" size={16} color={textColor} />
              <AppText style={[styles.addBtnLabel, { color: textColor }]}>
                Add Another Transportation
              </AppText>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <WizardBottomActionBar
        leftLabel="Back"
        onLeftPress={onBack}
        rightLabel="Next"
        onRightPress={onNext}
      />

      {/* ── DateTime picker modal ───────────────────────────────────── */}
      {pickerVisible &&
        (Platform.OS === 'android' ? (
          <DateTimePicker
            value={pickerDate}
            mode="datetime"
            display="default"
            onChange={(_, date) => {
              if (!date) { setPickerVisible(false); return; }
              setPickerDate(date);
              const iso = date.toISOString();
              const key = pickerItemId!;
              onTravelInfoChange(
                travelInfoItems.map((item) =>
                  item.id === key
                    ? pickerField === 'start'
                      ? { ...item, startDatetime: iso }
                      : { ...item, endDatetime: iso }
                    : item,
                ),
              );
              setPickerVisible(false);
              setPickerItemId(null);
            }}
          />
        ) : (
          <Modal visible transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
            <View style={styles.pickerOverlay}>
              <TouchableOpacity
                style={styles.pickerScrim}
                activeOpacity={1}
                onPress={() => setPickerVisible(false)}
              />
              <View style={[styles.pickerCard, { backgroundColor: surface }]}>
                <AppText style={[styles.pickerTitle, { color: textColor }]}>
                  {pickerField === 'start' ? 'Select date & time' : 'Select end date & time'}
                </AppText>
                <DateTimePicker
                  value={pickerDate}
                  mode="datetime"
                  display="spinner"
                  onChange={(_, date) => { if (date) setPickerDate(date); }}
                />
                <View style={styles.pickerActions}>
                  <TouchableOpacity
                    onPress={() => setPickerVisible(false)}
                    style={[styles.pickerCancelBtn, { borderColor: border }]}
                  >
                    <AppText style={[styles.pickerCancelLabel, { color: textColor }]}>Cancel</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirmPicker}
                    style={[styles.pickerConfirmBtn, { backgroundColor: accent }]}
                  >
                    <AppText style={styles.pickerConfirmLabel}>Done</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ))}
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: 16,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    gap: 16,
  },
  emptyTitle: {
    ...typography.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyHint: {
    ...typography.sm,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  // Transport card
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  cardTitle: {
    ...typography.sm,
    fontWeight: '600',
    flex: 1,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },

  cardBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: 16,
  },

  // Type chips
  typeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },

  // Field wrapper (for date pickers with label)
  fieldWrap: { gap: 8 },
  fieldLabel: { ...typography.sm, fontWeight: '500' as const, marginBottom: 8 },

  // Date button
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  dateBtnLabel: { ...typography.sm },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  addBtnLabel: { ...typography.sm, fontWeight: '500' },

  // DateTime picker modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  pickerScrim: { ...StyleSheet.absoluteFillObject },
  pickerCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radii.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  pickerTitle: {
    ...typography.base,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  pickerCancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  pickerCancelLabel: { ...typography.sm },
  pickerConfirmBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  pickerConfirmLabel: { ...typography.sm, fontWeight: '600', color: '#fff' },
});
