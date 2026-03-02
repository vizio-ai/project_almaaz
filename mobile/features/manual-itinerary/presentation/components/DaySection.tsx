import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';
import type { ItineraryDay } from '../../domain/entities/ItineraryDay';
import type { Activity } from '../../domain/entities/Activity';

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
  onAddActivity: (dayId: string, name: string) => Promise<unknown>;
  onEditActivity: (activityId: string, name: string) => Promise<unknown>;
  onRemoveActivity: (activityId: string) => Promise<unknown>;
  onUpdateDay: (dayId: string, notes: string | null) => Promise<unknown>;
  onRemoveDay: (dayId: string) => Promise<unknown>;
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
}: DaySectionProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const accent = useThemeColor('accent');

  // ── Activity state ─────────────────────────────────────────────────────────
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busy, setBusy] = useState(false);

  // ── Day note state ─────────────────────────────────────────────────────────
  const [dayNotes, setDayNotes] = useState(day.notes ?? '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesBusy, setNotesBusy] = useState(false);

  const handleAdd = useCallback(async () => {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      await onAddActivity(day.id, newName.trim());
      setNewName('');
    } finally {
      setBusy(false);
    }
  }, [newName, busy, day.id, onAddActivity]);

  const handleEdit = useCallback(async () => {
    if (!editingId || !editingName.trim() || busy) return;
    setBusy(true);
    try {
      await onEditActivity(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    } finally {
      setBusy(false);
    }
  }, [editingId, editingName, busy, onEditActivity]);

  const handleRemoveActivity = useCallback(
    async (activityId: string) => {
      if (busy) return;
      setBusy(true);
      try {
        await onRemoveActivity(activityId);
      } finally {
        setBusy(false);
      }
    },
    [busy, onRemoveActivity],
  );

  const handleNoteSave = useCallback(async () => {
    if (notesBusy) return;
    setNotesBusy(true);
    try {
      await onUpdateDay(day.id, dayNotes.trim() || null);
      setIsEditingNotes(false);
    } finally {
      setNotesBusy(false);
    }
  }, [day.id, dayNotes, notesBusy, onUpdateDay]);

  const startEdit = (act: Activity) => {
    setEditingId(act.id);
    setEditingName(act.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <View style={styles.daySection}>
      {/* ── Day header ──────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.dayHeader} onPress={onToggle} activeOpacity={0.7}>
        <AppText style={[styles.dayTitle, { color: textColor }]}>
          {formatDayLabel(day.date, day.dayNumber)}
        </AppText>
        <View style={styles.dayHeaderRight}>
          <TouchableOpacity onPress={() => onRemoveDay(day.id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={secondary} />
          </TouchableOpacity>
          <Ionicons
            name={isCollapsed ? 'chevron-down' : 'chevron-up'}
            size={20}
            color={secondary}
          />
        </View>
      </TouchableOpacity>

      {/* ── Expanded body ───────────────────────────────────────────────── */}
      {!isCollapsed && (
        <>
          {/* ── Note section ──────────────────────────────────────────── */}
          {isEditingNotes || dayNotes.length > 0 ? (
            <View style={[styles.noteCard, { backgroundColor: surface, borderColor: border }]}>
              <View style={styles.noteCardRow}>
                <AppText style={[styles.noteLabel, { color: secondary }]}>Note</AppText>
                {!isEditingNotes && (
                  <TouchableOpacity onPress={() => setIsEditingNotes(true)} hitSlop={8}>
                    <Ionicons name="pencil-outline" size={15} color={secondary} />
                  </TouchableOpacity>
                )}
              </View>
              {isEditingNotes ? (
                <>
                  <TextInput
                    style={[styles.noteInput, { color: textColor }]}
                    placeholder="Add a note for this day…"
                    placeholderTextColor={secondary}
                    multiline
                    value={dayNotes}
                    onChangeText={setDayNotes}
                    autoFocus
                  />
                  <TouchableOpacity
                    onPress={handleNoteSave}
                    disabled={notesBusy}
                    style={styles.noteSaveBtn}
                  >
                    {notesBusy ? (
                      <ActivityIndicator size="small" color={accent} />
                    ) : (
                      <AppText style={[styles.noteSaveLabel, { color: accent }]}>Save</AppText>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <AppText style={[styles.noteText, { color: textColor }]} numberOfLines={4}>
                  {dayNotes}
                </AppText>
              )}
            </View>
          ) : (
            /* "Add a note" right-aligned link */
            <TouchableOpacity
              style={styles.addNoteRow}
              onPress={() => setIsEditingNotes(true)}
              hitSlop={8}
            >
              <AppText style={[styles.addNoteLabel, { color: secondary }]}>Add a note</AppText>
            </TouchableOpacity>
          )}

          {/* ── Activity list ──────────────────────────────────────────── */}
          {dayActivities.map((act) =>
            editingId === act.id ? (
              /* ── Inline edit card ─────────────────────────────────── */
              <View
                key={act.id}
                style={[styles.editCard, { backgroundColor: surface, borderColor: accent }]}
              >
                <View style={styles.editCardHeader}>
                  <AppText style={[styles.editCardTitle, { color: textColor }]}>
                    {act.name}
                  </AppText>
                  <TouchableOpacity onPress={cancelEdit} hitSlop={8}>
                    <Ionicons name="close" size={18} color={secondary} />
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[styles.editCardInput, { color: textColor, borderColor: border }]}
                  placeholder="Activity name"
                  placeholderTextColor={secondary}
                  value={editingName}
                  onChangeText={setEditingName}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleEdit}
                  selectTextOnFocus
                />
                <View style={styles.editCardActions}>
                  <TouchableOpacity
                    onPress={() => handleRemoveActivity(act.id)}
                    disabled={busy}
                    style={styles.deleteBtn}
                  >
                    <AppText style={styles.deleteBtnLabel}>Delete</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleEdit}
                    disabled={busy || !editingName.trim()}
                    style={[styles.saveBtn, { backgroundColor: textColor }]}
                  >
                    {busy ? (
                      <ActivityIndicator size="small" color={surface} />
                    ) : (
                      <AppText style={[styles.saveBtnLabel, { color: surface }]}>Save</AppText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* ── Activity info card ─────────────────────────────────── */
              <View
                key={act.id}
                style={[styles.activityCard, { backgroundColor: surface, borderColor: border }]}
              >
                {/* Drag handle (static visual) */}
                <View style={styles.dragHandle}>
                  <AppText style={[styles.dragDots, { color: border }]}>⠿</AppText>
                </View>

                <View style={styles.activityContent}>
                  <AppText style={[styles.activityName, { color: textColor }]}>
                    {act.name}
                  </AppText>
                  {act.locationText ? (
                    <View style={styles.tagsRow}>
                      <View style={[styles.tag, { backgroundColor: border }]}>
                        <Ionicons name="location-outline" size={11} color={secondary} />
                        <AppText style={[styles.tagLabel, { color: secondary }]}>
                          {act.locationText}
                        </AppText>
                      </View>
                    </View>
                  ) : null}
                </View>

                <TouchableOpacity onPress={() => startEdit(act)} hitSlop={8}>
                  <Ionicons name="pencil-outline" size={16} color={secondary} />
                </TouchableOpacity>
              </View>
            ),
          )}

          {/* ── Inline add activity input (always visible) ─────────────── */}
          <View style={[styles.addActivityRow, { borderColor: border }]}>
            <TextInput
              style={[styles.addActivityInput, { color: textColor }]}
              placeholder="Activity Name (Optional)"
              placeholderTextColor={secondary}
              value={newName}
              onChangeText={setNewName}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            {newName.trim().length > 0 && (
              <TouchableOpacity onPress={handleAdd} disabled={busy} hitSlop={8}>
                {busy ? (
                  <ActivityIndicator size="small" color={accent} />
                ) : (
                  <Ionicons name="checkmark" size={20} color={accent} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  daySection: { marginBottom: spacing.xl },

  // ── Day header ─────────────────────────────────────────────────────────────
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayTitle: { ...typography.base, fontWeight: typography.weights.semibold, flex: 1 },

  // ── Note section ───────────────────────────────────────────────────────────
  addNoteRow: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  addNoteLabel: { ...typography.caption },
  noteCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noteCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  noteLabel: { ...typography.caption, fontWeight: typography.weights.medium },
  noteText: { ...typography.sm },
  noteInput: { ...typography.sm, minHeight: 72, paddingVertical: spacing.xs },
  noteSaveBtn: { alignSelf: 'flex-end', paddingTop: spacing.sm },
  noteSaveLabel: { ...typography.sm, fontWeight: typography.weights.medium },

  // ── Edit card ──────────────────────────────────────────────────────────────
  editCard: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  editCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  editCardTitle: { ...typography.sm, fontWeight: typography.weights.semibold },
  editCardInput: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.sm,
    marginBottom: spacing.md,
  },
  editCardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  deleteBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
  },
  deleteBtnLabel: { ...typography.sm, color: '#EF4444', fontWeight: typography.weights.medium },
  saveBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
  },
  saveBtnLabel: { ...typography.sm, fontWeight: typography.weights.medium },

  // ── Activity card ──────────────────────────────────────────────────────────
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  dragHandle: { width: 16, alignItems: 'center' },
  dragDots: { fontSize: 16, lineHeight: 20 },
  activityContent: { flex: 1 },
  activityName: { ...typography.sm, fontWeight: typography.weights.medium },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
  },
  tagLabel: { ...typography.caption },

  // ── Inline add activity row ────────────────────────────────────────────────
  addActivityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  addActivityInput: { flex: 1, ...typography.sm },
});
