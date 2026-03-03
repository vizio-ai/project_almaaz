import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Trash2, ChevronDown, ChevronUp, Pencil, X, MapPin, Check, GripVertical } from 'lucide-react-native';
import { AppText, PrimaryButton, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';
import { NoteCreateCard } from './NoteCreateCard';
import type { ItineraryDay } from '../../domain/entities/ItineraryDay';
import type { Activity } from '../../domain/entities/Activity';
import { LocationMapModal } from './LocationMapModal';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';

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
  /** Called when user picks / clears a location for an activity. */
  onUpdateActivityLocation?: (
    activityId: string,
    locationText: string | null,
    latitude: number | null,
    longitude: number | null,
  ) => Promise<unknown>;
  /** Called after a drag-and-drop reorder. Receives the new ordered IDs. */
  onReorderActivities?: (dayId: string, orderedIds: string[]) => Promise<unknown>;
  /** Long-press handler from the parent DraggableFlatList — activates day drag. */
  onDragDay?: () => void;
  /** True while this day is being actively dragged. */
  isDraggingDay?: boolean;
  /** Base trip location used to seed the location search query. */
  baseLocation?: string;
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
  onUpdateActivityLocation,
  onReorderActivities,
  onDragDay,
  isDraggingDay = false,
  baseLocation,
}: DaySectionProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const accent = useThemeColor('accent');

  // ── Activity state ─────────────────────────────────────────────────────────
  const [orderedActivities, setOrderedActivities] = useState(dayActivities);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [busy, setBusy] = useState(false);

  // Keep local order in sync when parent refreshes (e.g. after add/remove)
  useEffect(() => {
    setOrderedActivities(dayActivities);
  }, [dayActivities]);

  // ── Location modal state ────────────────────────────────────────────────────
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [locationModalActivityId, setLocationModalActivityId] = useState<string | null>(null);
  const [locationModalInitialQuery, setLocationModalInitialQuery] = useState('');

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

  // ── Location modal handlers ─────────────────────────────────────────────────

  const openLocationModal = useCallback(
    (act: Activity) => {
      const current = act.locationText ?? '';
      const fallback = baseLocation && baseLocation !== '—' ? baseLocation : '';
      setLocationModalActivityId(act.id);
      setLocationModalInitialQuery(current || fallback);
      setLocationModalVisible(true);
    },
    [baseLocation],
  );

  const handleSelectLocation = useCallback(
    async (name: string, lat?: number | null, lng?: number | null) => {
      const actId = locationModalActivityId;
      setLocationModalVisible(false);
      setLocationModalActivityId(null);
      if (!actId || !onUpdateActivityLocation) return;
      await onUpdateActivityLocation(actId, name || null, lat ?? null, lng ?? null);
    },
    [locationModalActivityId, onUpdateActivityLocation],
  );

  return (
    <View style={[styles.daySection, isDraggingDay && styles.daySectionDragging]}>
      {/* ── Day header ──────────────────────────────────────────────────── */}
      <TouchableOpacity style={styles.dayHeader} onPress={onToggle} activeOpacity={0.7}>
        {/* Day drag handle — long-press to reorder days */}
        {onDragDay && (
          <TouchableOpacity
            onLongPress={onDragDay}
            delayLongPress={200}
            hitSlop={6}
            style={styles.dayDragHandle}
          >
            <GripVertical size={18} color={secondary} strokeWidth={1.5} />
          </TouchableOpacity>
        )}
        <AppText style={[styles.dayTitle, { color: textColor }]}>
          {formatDayLabel(day.date, day.dayNumber)}
        </AppText>
        <View style={styles.dayHeaderRight}>
          <TouchableOpacity onPress={() => onRemoveDay(day.id)} hitSlop={8}>
            <Trash2 size={16} color={secondary} strokeWidth={1.8} />
          </TouchableOpacity>
          {isCollapsed ? (
            <ChevronDown size={20} color={secondary} strokeWidth={1.8} />
          ) : (
            <ChevronUp size={20} color={secondary} strokeWidth={1.8} />
          )}
        </View>
      </TouchableOpacity>

      {/* ── Expanded body ───────────────────────────────────────────────── */}
      {!isCollapsed && (
        <>
          {/* ── Note section ──────────────────────────────────────────── */}
          {!dayNotes && !isEditingNotes ? (
            /* State 1: No note → Add Note button */
            <PrimaryButton
              variant="outline"
              label="Add Note"
              onPress={() => setIsEditingNotes(true)}
              style={styles.addNoteBtn}
            />
          ) : isEditingNotes ? (
            /* State 2: Creating or editing → NoteCreateCard */
            <View style={{ marginBottom: spacing.md }}>
              <NoteCreateCard
                value={dayNotes}
                onChange={setDayNotes}
                onSave={handleNoteSave}
                isSaving={notesBusy}
              />
            </View>
          ) : (
            /* State 3: Has note, viewing → NoteCard */
            <View style={[styles.noteCard, { backgroundColor: surface, borderColor: border }]}>
              <View style={styles.noteCardRow}>
                <AppText style={[styles.noteLabel, { color: secondary }]}>Note</AppText>
                <TouchableOpacity onPress={() => setIsEditingNotes(true)} hitSlop={8}>
                  <Pencil size={15} color={secondary} strokeWidth={1.8} />
                </TouchableOpacity>
              </View>
              <AppText style={[styles.noteText, { color: textColor }]} numberOfLines={4}>
                {dayNotes}
              </AppText>
            </View>
          )}

          {/* ── Activity list ──────────────────────────────────────────── */}
          <DraggableFlatList
            data={orderedActivities}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            activationDistance={10}
            onDragEnd={({ data }) => {
              setOrderedActivities(data);
              onReorderActivities?.(day.id, data.map((a) => a.id));
            }}
            renderItem={({ item: act, drag, isActive }) => (
              <ScaleDecorator activeScale={1.02}>
                {editingId === act.id ? (
                  /* ── Inline edit card ───────────────────────────────── */
                  <View style={[styles.editCard, { backgroundColor: surface, borderColor: accent }]}>
                    <View style={styles.editCardHeader}>
                      <AppText style={[styles.editCardTitle, { color: textColor }]}>
                        {act.name}
                      </AppText>
                      <TouchableOpacity onPress={cancelEdit} hitSlop={8}>
                        <X size={18} color={secondary} strokeWidth={1.8} />
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
                    {onUpdateActivityLocation && (
                      <TouchableOpacity
                        style={[styles.locationRow, { borderColor: border }]}
                        onPress={() => openLocationModal(act)}
                        hitSlop={4}
                      >
                        <MapPin size={14} color={act.locationText ? accent : secondary} strokeWidth={1.8} />
                        <AppText
                          style={[styles.locationLabel, { color: act.locationText ? textColor : secondary }]}
                          numberOfLines={1}
                        >
                          {act.locationText || 'Add location'}
                        </AppText>
                      </TouchableOpacity>
                    )}
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
                  /* ── Activity info card ─────────────────────────────── */
                  <View
                    style={[
                      styles.activityCard,
                      { backgroundColor: surface, borderColor: isActive ? accent : border },
                    ]}
                  >
                    {/* Drag handle — long-press to activate drag */}
                    <TouchableOpacity
                      onLongPress={drag}
                      delayLongPress={200}
                      disabled={editingId !== null}
                      style={styles.dragHandle}
                      hitSlop={4}
                    >
                      <GripVertical size={16} color={border} strokeWidth={1.5} />
                    </TouchableOpacity>

                    <View style={styles.activityContent}>
                      <AppText style={[styles.activityName, { color: textColor }]}>
                        {act.name}
                      </AppText>
                      {act.locationText ? (
                        <View style={styles.tagsRow}>
                          <View style={[styles.tag, { backgroundColor: border }]}>
                            <MapPin size={11} color={secondary} strokeWidth={1.8} />
                            <AppText style={[styles.tagLabel, { color: secondary }]}>
                              {act.locationText}
                            </AppText>
                          </View>
                        </View>
                      ) : null}
                    </View>

                    <TouchableOpacity onPress={() => startEdit(act)} hitSlop={8}>
                      <Pencil size={16} color={secondary} strokeWidth={1.8} />
                    </TouchableOpacity>
                  </View>
                )}
              </ScaleDecorator>
            )}
          />

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
                  <Check size={20} color={accent} strokeWidth={1.8} />
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* ── Location map modal ──────────────────────────────────────────── */}
      <LocationMapModal
        visible={locationModalVisible}
        initialQuery={locationModalInitialQuery}
        onSelect={handleSelectLocation}
        onClose={() => {
          setLocationModalVisible(false);
          setLocationModalActivityId(null);
        }}
        allowPointPick
      />
    </View>
  );
}

const styles = StyleSheet.create({
  daySection: { marginBottom: spacing.xl },
  daySectionDragging: { opacity: 0.9 },

  // ── Day header ─────────────────────────────────────────────────────────────
  dayDragHandle: { marginRight: spacing.xs },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dayHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayTitle: { ...typography.base, fontWeight: typography.weights.semibold, flex: 1 },

  // ── Note section ───────────────────────────────────────────────────────────
  addNoteBtn: {
    marginBottom: spacing.sm,
  },
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  locationLabel: {
    ...typography.caption,
    flex: 1,
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
  dragHandle: { width: 20, alignItems: 'center', justifyContent: 'center' },
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
