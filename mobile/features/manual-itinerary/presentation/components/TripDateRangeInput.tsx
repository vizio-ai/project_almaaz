import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDateRange(startDate: Date | null, endDate: Date | null): string {
  if (!startDate && !endDate) return '';
  if (!endDate && startDate) {
    return startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (!startDate && endDate) {
    return endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const s = startDate!;
  const e = endDate!;
  const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
  const year = e.getFullYear();
  if (sMonth === eMonth && s.getFullYear() === year) {
    return `${sMonth} ${s.getDate()}–${e.getDate()}, ${year}`;
  }
  return `${sMonth} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${year}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface TripDateRangeInputProps {
  startDate: Date | null;
  endDate: Date | null;
  /** When undefined the field is display-only. */
  onStartDate?: (date: Date) => void;
  onEndDate?: (date: Date) => void;
  /** Pre-formatted date range string used in display-only mode. */
  displayText?: string;
}

type PickerStep = 'start' | 'end' | null;

export function TripDateRangeInput({
  startDate,
  endDate,
  onStartDate,
  onEndDate,
  displayText,
}: TripDateRangeInputProps) {
  const secondary = useThemeColor('textSecondary');
  const textColor = useThemeColor('text');
  const surface = useThemeColor('surface');
  const accent = useThemeColor('accent');

  const [pickerStep, setPickerStep] = useState<PickerStep>(null);
  const [localDate, setLocalDate] = useState(new Date());

  const editable = !!onStartDate;
  const label = editable
    ? formatDateRange(startDate, endDate) || 'Add dates'
    : (displayText ?? formatDateRange(startDate, endDate) ?? '—');

  function openPicker() {
    if (!editable) return;
    setLocalDate(startDate ?? new Date());
    setPickerStep('start');
  }

  function handleConfirm() {
    if (pickerStep === 'start') {
      onStartDate?.(localDate);
      setLocalDate(endDate ?? localDate);
      setPickerStep('end');
    } else if (pickerStep === 'end') {
      onEndDate?.(localDate);
      setPickerStep(null);
    }
  }

  function handleDismiss() {
    setPickerStep(null);
  }

  const showLabel = pickerStep === 'start' ? 'Start date' : 'End date';
  const minimumDate = pickerStep === 'end' ? (startDate ?? undefined) : undefined;

  return (
    <View style={styles.row}>
      {editable ? (
        <TouchableOpacity onPress={openPicker} activeOpacity={0.7} style={styles.rowTouchable}>
          <Ionicons name="calendar-outline" size={14} color={secondary} />
          <AppText style={[styles.label, { color: (startDate || endDate) ? textColor : secondary }]}>
            {label}
          </AppText>
        </TouchableOpacity>
      ) : (
        <>
          <Ionicons name="calendar-outline" size={14} color={secondary} />
          <AppText style={[styles.label, { color: secondary }]} numberOfLines={1}>
            {label}
          </AppText>
        </>
      )}

      {/* ── Picker modal ─────────────────────────────────────────────── */}
      {pickerStep !== null && (
        Platform.OS === 'android' ? (
          <DateTimePicker
            value={localDate}
            mode="date"
            display="default"
            minimumDate={minimumDate}
            onChange={(_, date) => {
              if (date) {
                setLocalDate(date);
                if (pickerStep === 'start') {
                  onStartDate?.(date);
                  setLocalDate(endDate ?? date);
                  setPickerStep('end');
                } else {
                  onEndDate?.(date);
                  setPickerStep(null);
                }
              } else {
                handleDismiss();
              }
            }}
          />
        ) : (
          <Modal visible transparent animationType="none" onRequestClose={handleDismiss}>
            <View style={pickerStyles.overlay}>
              <TouchableOpacity
                style={pickerStyles.scrim}
                activeOpacity={1}
                onPress={handleDismiss}
              />
              <View style={[pickerStyles.sheet, { backgroundColor: surface }]}>
                <AppText style={[pickerStyles.stepLabel, { color: secondary }]}>
                  {showLabel}
                </AppText>
                <DateTimePicker
                  value={localDate}
                  mode="date"
                  display="spinner"
                  minimumDate={minimumDate}
                  onChange={(_, date) => { if (date) setLocalDate(date); }}
                />
                <View style={pickerStyles.actions}>
                  <TouchableOpacity onPress={handleDismiss} style={pickerStyles.cancelBtn}>
                    <AppText style={[pickerStyles.cancelLabel, { color: secondary }]}>Cancel</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleConfirm}
                    style={[pickerStyles.confirmBtn, { backgroundColor: accent }]}
                  >
                    <AppText style={pickerStyles.confirmLabel}>
                      {pickerStep === 'start' ? 'Next' : 'Done'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  rowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  label: {
    ...typography.sm,
  },
});

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    paddingBottom: 32,
    paddingTop: spacing.lg,
  },
  stepLabel: {
    ...typography.sm,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  cancelBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  cancelLabel: { ...typography.base },
  confirmBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  confirmLabel: { ...typography.base, fontWeight: '600', color: '#fff' },
});
