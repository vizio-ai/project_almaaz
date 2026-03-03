import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { AppText, useThemeColor, spacing, typography, radii } from '@shared/ui-kit';

export interface NoteCreateCardProps {
  value: string;
  onChange: (text: string) => void;
  onSave: () => void;
  isSaving?: boolean;
  placeholder?: string;
}

export function NoteCreateCard({
  value,
  onChange,
  onSave,
  isSaving = false,
  placeholder = 'Add details for this day…',
}: NoteCreateCardProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('background');
  const border = useThemeColor('border');
  const accent = useThemeColor('accent');

  const canSave = value.trim().length > 0;

  return (
    <View style={styles.container}>
      <AppText style={[styles.label, { color: textColor }]}>Add a note</AppText>
      <View style={[styles.inputBox, { backgroundColor: surface, borderColor: border }]}>
        <TextInput
          style={[styles.textInput, { color: textColor }]}
          placeholder={placeholder}
          placeholderTextColor={secondary}
          multiline
          textAlignVertical="top"
          value={value}
          onChangeText={onChange}
          autoFocus
        />
        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving || !canSave}
          style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
          hitSlop={8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={accent} />
          ) : (
            <AppText style={[styles.saveBtnLabel, { color: textColor }]}>Save</AppText>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
    marginBottom: 0,
  },
  label: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    minHeight: 60,
    overflow: 'hidden',
  },
  textInput: {
    ...typography.sm,
    lineHeight: 20,
    minHeight: 40,
    paddingVertical: 0,
  },
  saveBtn: {
    alignSelf: 'flex-end',
    borderRadius: radii.rounded,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnLabel: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
    lineHeight: 20,
  },
});
