import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';

export interface TripNotesSectionProps {
  value: string;
  onChangeText: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function TripNotesSection({
  value,
  onChangeText,
  onSave,
  isSaving,
}: TripNotesSectionProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');

  return (
    <View style={styles.section}>
      <AppText style={[styles.sectionTitle, { color: textColor }]}>
        Add a note or things to remember
      </AppText>
      <View style={[styles.noteWrap, { backgroundColor: surface, borderColor: border }]}>
        <TextInput
          style={[styles.noteInput, { color: textColor }]}
          placeholder="Placeholder"
          placeholderTextColor={secondary}
          multiline
          value={value}
          onChangeText={onChangeText}
        />
        <TouchableOpacity onPress={onSave} disabled={isSaving} style={styles.noteSaveBtn}>
          <AppText style={[styles.noteSaveBtnLabel, { color: secondary }]}>Save</AppText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    ...typography.base,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  noteWrap: {
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  noteInput: {
    minHeight: 100,
    padding: spacing.lg,
    ...typography.sm,
  },
  noteSaveBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  noteSaveBtnLabel: { ...typography.sm, fontWeight: typography.weights.medium },
});

