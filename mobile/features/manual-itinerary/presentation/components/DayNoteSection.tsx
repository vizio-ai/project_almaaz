import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { AppText, PrimaryButton, useThemeColor, typography, spacing, radii, elevatedCard } from '@shared/ui-kit';
import { NoteCreateCard } from './NoteCreateCard';

export interface DayNoteSectionProps {
  initialNote?: string | null;
  onSave: (note: string | null) => Promise<void>;
}

export function DayNoteSection({ initialNote, onSave }: DayNoteSectionProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');

  const [note, setNote] = useState(initialNote ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(note.trim() || null);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  // No note, not editing — show a compact right-aligned "Add Note" button
  if (!note && !isEditing) {
    return (
      <View style={styles.addNoteRow}>
        <PrimaryButton
          variant="outline"
          label="Add Note"
          onPress={() => setIsEditing(true)}
          style={styles.addNoteButton}
        />
      </View>
    );
  }

  // Editing — show NoteCreateCard
  if (isEditing) {
    return (
      <NoteCreateCard
        value={note}
        onChange={setNote}
        onSave={handleSave}
        isSaving={isSaving}
      />
    );
  }

  // Has note — show elevated read-only card with edit action
  return (
    <View style={styles.noteCard}>
      <View style={styles.noteCardRow}>
        <AppText style={[styles.noteLabel, { color: secondary }]}>Note</AppText>
        <TouchableOpacity onPress={() => setIsEditing(true)} hitSlop={8}>
          <Pencil size={15} color={secondary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>
      <AppText style={[styles.noteText, { color: textColor }]} numberOfLines={4}>
        {note}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  // Right-aligned "Add Note" button
  addNoteRow: {
    alignItems: 'flex-end',
  },
  addNoteButton: {
    width: 105,
    borderColor: '#E4E4E7',
  },

  // Note view card — elevated like ActivityCard
  noteCard: {
    ...elevatedCard,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  noteCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  noteLabel: { ...typography.caption, fontWeight: typography.weights.medium },
  noteText: { ...typography.sm },
});
