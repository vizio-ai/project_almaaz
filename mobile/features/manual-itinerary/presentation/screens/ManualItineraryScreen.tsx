import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AppHeader,
  AppText,
  HeaderActions,
  HeaderTitle,
  CoverImagePicker,
  TripTitleInput,
  useThemeColor,
  typography,
  spacing,
  radii,
} from '@shared/ui-kit';
import { useGetItinerary } from '../hooks/useGetItinerary';
import { useActivityMutations } from '../hooks/useActivityMutations';
import { useDayMutations } from '../hooks/useDayMutations';
import { useTravelInfoMutations } from '../hooks/useTravelInfoMutations';
import { useManualItineraryDependencies } from '../../di/ManualItineraryProvider';
import { DaySection } from '../components/DaySection';
import { TravelInfoFormModal } from '../components/TravelInfoFormModal';
import { TripLocationInput } from '../components/TripLocationInput';
import { TripDateRangeInput } from '../components/TripDateRangeInput';
import type { Activity } from '../../domain/entities/Activity';
import type { TravelInfo } from '../../domain/entities/TravelInfo';

type ViewTab = 'detailed' | 'summary' | 'map';

export interface ManualItineraryScreenProps {
  /** When null, show create form. When set, load existing itinerary from Supabase. */
  itineraryId: string | null;
  /** Required when creating a new itinerary. */
  userId: string;
  /** When false, header is not rendered (e.g. when embedded in Create tab). */
  showHeader?: boolean;
  onShare?: () => void;
  onBack?: () => void;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return '';
  if (!endDate) return formatDate(startDate);
  if (!startDate) return formatDate(endDate);
  const s = new Date(startDate);
  const e = new Date(endDate);
  const month = s.toLocaleDateString('en-US', { month: 'short' });
  const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
  const year = e.getFullYear();
  if (month === eMonth && s.getFullYear() === year) {
    return `${month} ${s.getDate()}–${e.getDate()}, ${year}`;
  }
  return `${month} ${s.getDate()} – ${eMonth} ${e.getDate()}, ${year}`;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ManualItineraryScreen({
  itineraryId,
  userId,
  showHeader = true,
  onShare,
  onBack,
}: ManualItineraryScreenProps) {
  const isNew = itineraryId === null;

  const { itinerary, days, activities, travelInfo, isLoading, error, refresh } =
    useGetItinerary(itineraryId);
  const { manualItineraryRepository } = useManualItineraryDependencies();
  const { addActivity, updateActivity, removeActivity } = useActivityMutations(refresh);
  const { addDay, updateDay, removeDay } = useDayMutations(itineraryId, refresh);
  const { addTravelInfo, updateTravelInfo, removeTravelInfo } = useTravelInfoMutations(
    itineraryId,
    refresh,
  );

  // ── Create mode state ──────────────────────────────────────────────────────
  const [draftCoverUri, setDraftCoverUri] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDestination, setDraftDestination] = useState('');
  const [draftStartDate, setDraftStartDate] = useState<Date | null>(null);
  const [draftEndDate, setDraftEndDate] = useState<Date | null>(null);

  // ── Shared state (create + edit) ──────────────────────────────────────────
  const [isPublic, setIsPublic] = useState(false);
  const [isClonable, setIsClonable] = useState(false);

  // ── Edit mode state ───────────────────────────────────────────────────────
  const [viewTab, setViewTab] = useState<ViewTab>('detailed');
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [tripNotes, setTripNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ── TravelInfo modal ──────────────────────────────────────────────────────
  const [travelInfoModalVisible, setTravelInfoModalVisible] = useState(false);
  const [editingTravelInfo, setEditingTravelInfo] = useState<TravelInfo | null>(null);

  React.useEffect(() => {
    if (!itinerary) return;
    setTripNotes(itinerary.tripNotes ?? '');
    setIsPublic(itinerary.isPublic ?? false);
    setIsClonable(itinerary.isClonable ?? false);
  }, [itinerary?.id]);

  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const surfaceAlt = useThemeColor('surfaceAlt');
  const border = useThemeColor('border');
  const accent = useThemeColor('accent');

  const toggleDay = useCallback((dayId: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      if (isNew) {
        const result = await manualItineraryRepository.create({
          userId,
          title: draftTitle.trim() || 'Untitled trip',
          destination: draftDestination.trim(),
          startDate: draftStartDate ? toISODate(draftStartDate) : null,
          endDate: draftEndDate ? toISODate(draftEndDate) : null,
          isPublic,
          isClonable,
          isAiGenerated: false,
        });
        if (result.success) onBack?.();
      } else {
        const result = await manualItineraryRepository.update(itineraryId!, {
          tripNotes: tripNotes || null,
          isPublic,
          isClonable,
        });
        if (result.success) refresh();
      }
    } finally {
      setIsSaving(false);
    }
  }, [
    isNew,
    itineraryId,
    userId,
    draftTitle,
    draftDestination,
    draftStartDate,
    draftEndDate,
    tripNotes,
    isPublic,
    isClonable,
    manualItineraryRepository,
    refresh,
    onBack,
  ]);

  // ── Derived values ────────────────────────────────────────────────────────

  const title = itinerary?.title ?? 'Untitled trip';
  const destination = itinerary?.destination ?? '—';
  const startDate = itinerary?.startDate ?? null;
  const creatorName = itinerary?.creatorName ?? 'You';
  const creatorAvatarUrl = itinerary?.creatorAvatarUrl ?? null;
  const coverImageUrl = itinerary?.coverImageUrl;

  const activitiesByDay = days.reduce<Record<string, Activity[]>>((acc, day) => {
    acc[day.id] = activities
      .filter((a: Activity) => a.dayId === day.id)
      .sort((a: Activity, b: Activity) => a.sortOrder - b.sortOrder);
    return acc;
  }, {});

  const headerActions = (
    <HeaderActions
      onSave={handleSave}
      saveLabel="Save itinerary"
      isSaving={isSaving}
      onShare={onShare}
      onMoreOptions={() => {}}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: surfaceAlt }]}>
      {/* ── App logo bar ───────────────────────────────────────────────── */}
      {showHeader && <AppHeader variant="light" />}

      {/* ── Screen title row: "Itinerary" ← → [Save][Share][⋯] ────────── */}
      <View style={[styles.screenTitleRow, { borderBottomColor: border }]}>
        <HeaderTitle title="Itinerary" />
        {headerActions}
      </View>

      {/* ── Loading state ──────────────────────────────────────────────── */}
      {!isNew && isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      )}

      {/* ── Error state ────────────────────────────────────────────────── */}
      {!isNew && !isLoading && error && (
        <View style={styles.centered}>
          <AppText style={[styles.errorText, { color: secondary }]}>{error}</AppText>
        </View>
      )}

      {/* ── Main content ───────────────────────────────────────────────── */}
      {(isNew || (!isLoading && !error)) && (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Cover image ───────────────────────────────────────────────── */}
        <CoverImagePicker
          imageUri={isNew ? draftCoverUri : coverImageUrl}
          onChange={isNew ? setDraftCoverUri : undefined}
          editable={isNew}
        />

        {/* ── Trip title ────────────────────────────────────────────────── */}
        <View style={styles.titleWrap}>
          <TripTitleInput
            value={isNew ? draftTitle : title}
            onChange={isNew ? setDraftTitle : undefined}
          />
        </View>

        {/* ── Location + Date row ───────────────────────────────────────── */}
        <View style={styles.metaInfoRow}>
          <TripLocationInput
            value={isNew ? draftDestination : destination}
            onChange={isNew ? setDraftDestination : undefined}
          />
          {isNew ? (
            <TripDateRangeInput
              startDate={draftStartDate}
              endDate={draftEndDate}
              onStartDate={setDraftStartDate}
              onEndDate={setDraftEndDate}
            />
          ) : (startDate || itinerary?.endDate) ? (
            <TripDateRangeInput
              startDate={null}
              endDate={null}
              displayText={formatDateRange(startDate, itinerary?.endDate ?? null)}
            />
          ) : null}
        </View>

        {/* ── Creator (edit mode only) ─────────────────────────────────── */}
        {!isNew && (
          <View style={styles.metaRow}>
            {creatorAvatarUrl ? (
              <Image source={{ uri: creatorAvatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: border }]} />
            )}
            <AppText style={[styles.metaText, { color: secondary }]}>
              Created by {creatorName}
            </AppText>
          </View>
        )}

        {/* ── Allow other users to clone ───────────────────────────────── */}
        <View style={[styles.toggleRow, { borderColor: border }]}>
          <AppText style={[styles.toggleLabel, { color: textColor }]}>
            Allow other users to clone
          </AppText>
          <Ionicons name="information-circle-outline" size={16} color={secondary} />
          <Switch
            value={isClonable}
            onValueChange={setIsClonable}
            trackColor={{ false: border, true: accent }}
          />
        </View>

        {/* ── Travel Information (edit mode only) ───────────────────────── */}
        {!isNew && (
          <View style={[styles.card, { backgroundColor: surface }]}>
            <View style={styles.cardHeader}>
              <AppText style={[styles.cardTitle, { color: textColor }]}>
                Travel Information
              </AppText>
              <TouchableOpacity
                onPress={() => { setEditingTravelInfo(null); setTravelInfoModalVisible(true); }}
                hitSlop={8}
              >
                <Ionicons name="add" size={22} color={secondary} />
              </TouchableOpacity>
            </View>
            {travelInfo.length === 0 ? (
              <AppText style={[styles.placeholderText, { color: secondary }]}>
                No travel info yet. Tap + to add.
              </AppText>
            ) : (
              travelInfo.map((t: TravelInfo) => (
                <TravelInfoRow
                  key={t.id}
                  item={t}
                  secondary={secondary}
                  textColor={textColor}
                  onEdit={() => { setEditingTravelInfo(t); setTravelInfoModalVisible(true); }}
                />
              ))
            )}
          </View>
        )}

        {/* ── Notes ─────────────────────────────────────────────────────── */}
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
              value={tripNotes}
              onChangeText={setTripNotes}
            />
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={styles.noteSaveBtn}
            >
              <AppText style={[styles.noteSaveBtnLabel, { color: secondary }]}>Save</AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── View tabs + days (edit mode only) ─────────────────────────── */}
        {!isNew && (
          <>
            <View style={styles.tabs}>
              {(['detailed', 'summary', 'map'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setViewTab(tab)}
                  style={[styles.tab, viewTab === tab && { backgroundColor: textColor }]}
                >
                  <AppText
                    style={[
                      styles.tabLabel,
                      { color: viewTab === tab ? surfaceAlt : textColor },
                    ]}
                  >
                    {tab === 'detailed'
                      ? 'Detailed View'
                      : tab === 'summary'
                      ? 'Summary View'
                      : 'Map View'}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            {viewTab === 'detailed' && (
              <>
                {days.map((day) => (
                  <DaySection
                    key={day.id}
                    day={day}
                    dayActivities={activitiesByDay[day.id] ?? []}
                    isCollapsed={collapsedDays.has(day.id)}
                    onToggle={() => toggleDay(day.id)}
                    onAddActivity={addActivity}
                    onEditActivity={updateActivity}
                    onRemoveActivity={removeActivity}
                    onUpdateDay={updateDay}
                    onRemoveDay={removeDay}
                  />
                ))}

                {/* ── Add Day button ─────────────────────────────────── */}
                <TouchableOpacity
                  style={[styles.addDayBtn, { borderColor: border }]}
                  onPress={() => addDay()}
                >
                  <Ionicons name="add" size={18} color={secondary} />
                  <AppText style={[styles.addDayLabel, { color: secondary }]}>Add Day</AppText>
                </TouchableOpacity>
              </>
            )}

            {viewTab === 'summary' && (
              <View style={styles.placeholderBlock}>
                <AppText style={[styles.placeholderText, { color: secondary }]}>
                  Summary view — coming soon
                </AppText>
              </View>
            )}
            {viewTab === 'map' && (
              <View style={styles.placeholderBlock}>
                <AppText style={[styles.placeholderText, { color: secondary }]}>
                  Map view — coming soon
                </AppText>
              </View>
            )}
          </>
        )}

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
      )}

      {/* ── TravelInfo modal ─────────────────────────────────────────────── */}
      <TravelInfoFormModal
        visible={travelInfoModalVisible}
        editingItem={editingTravelInfo}
        onAdd={addTravelInfo}
        onUpdate={updateTravelInfo}
        onRemove={removeTravelInfo}
        onClose={() => setTravelInfoModalVisible(false)}
      />
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TravelInfoRow({
  item,
  secondary,
  textColor,
  onEdit,
}: {
  item: TravelInfo;
  secondary: string;
  textColor: string;
  onEdit: () => void;
}) {
  const iconName =
    item.type === 'flight'
      ? 'airplane-outline'
      : item.type === 'rental_car'
      ? 'car-outline'
      : item.type === 'hotel'
      ? 'bed-outline'
      : ('document-text-outline' as const);
  const detail = [item.provider, item.detail].filter(Boolean).join(' · ') || item.title;

  return (
    <View style={styles.travelRow}>
      <Ionicons name={iconName} size={18} color={secondary} />
      <View style={styles.travelTextWrap}>
        <AppText style={[styles.travelTitle, { color: textColor }]}>{item.title}</AppText>
        {detail !== item.title && (
          <AppText style={[styles.travelDetail, { color: secondary }]}>{detail}</AppText>
        )}
      </View>
      <TouchableOpacity onPress={onEdit} hitSlop={8}>
        <Ionicons name="pencil-outline" size={16} color={secondary} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['2xl'],
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { ...typography.sm },
  screenTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleWrap: { marginTop: spacing.lg, marginBottom: spacing.sm },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metaText: { ...typography.sm, flex: 1 },
  avatar: { width: 24, height: 24, borderRadius: 12 },
  avatarPlaceholder: { width: 24, height: 24, borderRadius: 12 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  toggleRowNoTopBorder: { borderTopWidth: 0, marginTop: 0 },
  toggleLabelWrap: { flex: 1 },
  toggleLabel: { ...typography.sm, fontWeight: typography.weights.medium },
  toggleDesc: { ...typography.caption },
  card: { borderRadius: radii.md, padding: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.xl },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.base, fontWeight: typography.weights.semibold },
  placeholderText: { ...typography.sm },
  travelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  travelTextWrap: { flex: 1 },
  travelTitle: { ...typography.sm, fontWeight: typography.weights.medium },
  travelDetail: { ...typography.caption },
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
  tabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.rounded,
  },
  tabLabel: { ...typography.caption, fontWeight: typography.weights.medium },
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  addDayLabel: { ...typography.sm, fontWeight: typography.weights.medium },
  placeholderBlock: { paddingVertical: spacing['2xl'], alignItems: 'center' },
});
