import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AppText } from './AppText';
import { useThemeColor } from '../hooks/useThemeColor';
import { typography, spacing, radii } from '../theme';

export interface TimePickerBottomSheetProps {
  visible: boolean;
  /** Initial/current time value */
  value: Date;
  /** Called with the confirmed date on iOS Done press or Android picker change */
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  title?: string;
}

export function TimePickerBottomSheet({
  visible,
  value,
  onConfirm,
  onCancel,
  title = 'Select time',
}: TimePickerBottomSheetProps) {
  const [localDate, setLocalDate] = useState(value);
  const textColor = useThemeColor('text');
  const surface = useThemeColor('surface');
  const accent = useThemeColor('accent');

  useEffect(() => {
    if (visible) setLocalDate(value);
  }, [visible, value]);

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={localDate}
        mode="time"
        display="default"
        onChange={(_, date) => {
          if (!date) { onCancel(); return; }
          onConfirm(date);
        }}
      />
    );
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel} />
      <View style={[styles.sheet, { backgroundColor: surface }]}>
        <AppText style={[styles.title, { color: textColor }]}>{title}</AppText>
        <DateTimePicker
          value={localDate}
          mode="time"
          display="spinner"
          onChange={(_, date) => { if (date) setLocalDate(date); }}
        />
        <View style={styles.actions}>
          <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
            <AppText style={[styles.cancelLabel, { color: textColor }]}>Cancel</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onConfirm(localDate)}
            style={[styles.confirmBtn, { backgroundColor: accent }]}
          >
            <AppText style={styles.confirmLabel}>Done</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.lg,
    paddingBottom: 32,
  },
  title: {
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
  cancelBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  cancelLabel: {
    ...typography.base,
  },
  confirmBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  confirmLabel: {
    ...typography.base,
    fontWeight: '600',
    color: '#fff',
  },
});
