import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  HeaderActions,
  HeaderTitle,
  CoverImagePicker,
  TripTitleInput,
  CreatedByAuthor,
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
import { TravelInfoSection } from '../components/TravelInfoSection';
import { TripNotesSection } from '../components/TripNotesSection';
import { LocationMapModal } from '../components/LocationMapModal';
import { TripLocationInput } from '../components/TripLocationInput';
import { TripDateRangeInput } from '../components/TripDateRangeInput';
import { ItineraryViewTabs } from '../components/ItineraryViewTabs';
import { ToggleRow } from '@shared/ui-kit';
import type { Activity } from '../../domain/entities/Activity';
import type { TravelInfo } from '../../domain/entities/TravelInfo';
import type {
  AddTravelInfoParams,
  UpdateTravelInfoParams,
} from '../../domain/repository/ManualItineraryRepository';
import type { ItineraryDay } from '../../domain/entities/ItineraryDay';

type ViewTab = 'detailed' | 'summary' | 'map';

export interface ManualItineraryScreenProps {
  /** When null, show create form. When set, load existing itinerary from Supabase. */
  itineraryId: string | null;
  /** Required when creating a new itinerary. */
  userId: string;
  /** Logged-in user's display name; shown as "Created by {name}" in create mode. */
  currentUserName?: string | null;
  /** Logged-in user's avatar URL; shown in create mode when set. */
  currentUserAvatarUrl?: string | null;
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

function buildDraftDays(start: Date | null, end: Date | null): ItineraryDay[] {
  if (!start || !end) return [];

  const days: ItineraryDay[] = [];
  const startDate = new Date(start);
  const endDate = new Date(end);

  let index = 1;
  for (
    let d = new Date(startDate);
    d <= endDate;
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000), index += 1
  ) {
    days.push({
      id: `draft-${index}`,
      dayNumber: index,
      date: toISODate(d),
      notes: null,
    });
  }

  return days;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function ManualItineraryScreen({
  itineraryId,
  userId,
  currentUserName,
  currentUserAvatarUrl,
  showHeader = true,
  onShare,
  onBack,
}: ManualItineraryScreenProps) {
  const isNew = itineraryId === null;

  const { itinerary, days, activities, travelInfo, isLoading, error, refresh } =
    useGetItinerary(itineraryId);
  const { manualItineraryRepository } = useManualItineraryDependencies();
  const { addActivity, updateActivity, removeActivity, updateActivityLocation } = useActivityMutations(refresh);
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
  const [draftTravelInfo, setDraftTravelInfo] = useState<TravelInfo[]>([]);
  const [draftDayNotes, setDraftDayNotes] = useState<Record<string, string>>({});
  const draftActivitiesRef = useRef<Record<string, { name: string; locationText: string | null }[]>>({});

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

  const handleDraftAddTravelInfo = useCallback(
    async (params: AddTravelInfoParams) => {
      const id = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item: TravelInfo = {
        id,
        type: params.type,
        title: params.title,
        provider: params.provider ?? null,
        detail: params.detail ?? null,
        startDatetime: params.startDatetime ?? null,
        endDatetime: params.endDatetime ?? null,
      };
      setDraftTravelInfo((prev) => [...prev, item]);
    },
    [],
  );

  const handleDraftUpdateTravelInfo = useCallback(
    async (id: string, params: UpdateTravelInfoParams) => {
      setDraftTravelInfo((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                type: params.type ?? item.type,
                title: params.title ?? item.title,
                provider: params.provider ?? item.provider,
                detail: params.detail ?? item.detail,
                startDatetime: params.startDatetime ?? item.startDatetime,
                endDatetime: params.endDatetime ?? item.endDatetime,
              }
            : item,
        ),
      );
    },
    [],
  );

  const handleDraftRemoveTravelInfo = useCallback(async (id: string) => {
    setDraftTravelInfo((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // ── Location map modal (create mode: pick destination from OSM) ─────────────
  const [locationMapVisible, setLocationMapVisible] = useState(false);

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
  const borderMuted = useThemeColor('borderMuted');
  const background = useThemeColor('background');
  const accent = useThemeColor('accent');

  const toggleDay = useCallback((dayId: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  }, []);

  const effectiveDays: ItineraryDay[] = React.useMemo(
    () => (isNew ? buildDraftDays(draftStartDate, draftEndDate) : days),
    [isNew, draftStartDate, draftEndDate, days],
  );

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
          tripNotes: tripNotes || null,
          isAiGenerated: false,
          travelInfo: draftTravelInfo.map((t) => ({
            type: t.type,
            title: t.title,
            provider: t.provider ?? null,
            detail: t.detail ?? null,
            startDatetime: t.startDatetime ?? null,
            endDatetime: t.endDatetime ?? null,
          })),
        });
        if (result.success && result.id) {
          // Upload cover image to Storage and persist the public URL
          if (draftCoverUri) {
            const upload = await manualItineraryRepository.uploadCoverImage(
              userId,
              result.id,
              draftCoverUri,
            );
            if (upload.success && upload.url) {
              await manualItineraryRepository.update(result.id, { coverImageUrl: upload.url });
            }
          }

          // Create concrete days and their draft activities
          if (draftStartDate && draftEndDate) {
            const draftDays = buildDraftDays(draftStartDate, draftEndDate);
            for (const day of draftDays) {
              const note = draftDayNotes[day.id]?.trim() || null;
              const dayResult = await manualItineraryRepository.addDay(result.id, {
                date: day.date,
                notes: note,
              });
              if (dayResult.success && dayResult.id) {
                const acts = draftActivitiesRef.current[day.id] ?? [];
                for (const act of acts) {
                  if (act.name) {
                    await manualItineraryRepository.addActivity(dayResult.id, {
                      name: act.name,
                      locationText: act.locationText,
                    });
                  }
                }
              }
            }
          }

          onBack?.();
        }
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
    draftCoverUri,
    draftTitle,
    draftDestination,
    draftStartDate,
    draftEndDate,
    tripNotes,
    isPublic,
    isClonable,
    manualItineraryRepository,
    draftDayNotes,
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
      onShare={() => onShare?.()}
      onMoreOptions={() => {}}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      {/* ── Dora app top bar (Figma style) ───────────────────────────────── */}
      {showHeader && (
        <View style={styles.topBarContainer}>
          {/* Status row: time + system icons */}
          <View style={styles.statusRow}>
            <AppText style={styles.statusTime}>9:41</AppText>
            <View style={styles.statusIcons}>
              <Ionicons name="cellular" size={16} color="#FFFFFF" />
              <Ionicons name="wifi" size={16} color="#FFFFFF" style={styles.statusIcon} />
              <Ionicons
                name="battery-half-outline"
                size={20}
                color="#FFFFFF"
                style={styles.statusIcon}
              />
            </View>
          </View>

          {/* Brand row: dora. + actions */}
          <View style={styles.brandRow}>
            <View style={styles.logoRow}>
              <AppText style={styles.logoText}>dora</AppText>
              <AppText style={styles.logoDot}>.</AppText>
            </View>

            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.goBackPill}
                onPress={onBack}
                disabled={!onBack}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back-outline" size={16} color="#FFFFFF" />
                <AppText style={styles.goBackText}>Go back to chat</AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconCircleButton}
                onPress={onBack}
                disabled={!onBack}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ── Screen title row: "Itinerary" ← → [Save][Share][⋯] ────────── */}
      <View
        style={[
          styles.screenTitleRow,
          { borderBottomColor: borderMuted, backgroundColor: background },
        ]}
      >
        <AppText style={styles.screenTitleText}>Itinerary</AppText>
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
          <View style={styles.metaLocationWrap}>
            <TripLocationInput
              value={isNew ? draftDestination : destination}
              onChange={isNew ? setDraftDestination : undefined}
              onLocationIconPress={isNew ? () => setLocationMapVisible(true) : undefined}
            />
          </View>
          <View style={styles.metaDateWrap}>
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
        </View>

        {/* ── Creator ───────────────────────────────────────────────────── */}
        <View style={styles.metaRow}>
          <CreatedByAuthor
            userName={isNew ? (currentUserName?.trim() || 'You') : creatorName}
            avatarUrl={isNew ? currentUserAvatarUrl : creatorAvatarUrl}
          />
        </View>

        {/* ── Allow other users to clone ───────────────────────────────── */}
        <ToggleRow
          label="Allow other users to clone"
          value={isClonable}
          onValueChange={setIsClonable}
          infoMessage="This lets other users use your itinerary as a starting point to plan their own trip"
        />

        {/* ── Public / Private visibility ───────────────────────────────── */}
        <ToggleRow
          label={isPublic ? 'Public itinerary' : 'Private itinerary'}
          value={isPublic}
          onValueChange={setIsPublic}
          infoMessage="When public, other users may see this itinerary in discover or shared views. When private, only you can see it."
        />

        {/* ── Travel Information ────────────────────────────────────────── */}
        <TravelInfoSection
          items={isNew ? draftTravelInfo : travelInfo}
          onAddPress={() => {
            setEditingTravelInfo(null);
            setTravelInfoModalVisible(true);
          }}
          onEditItem={(t) => {
            setEditingTravelInfo(t);
            setTravelInfoModalVisible(true);
          }}
        />

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        <TripNotesSection
          value={tripNotes}
          onChangeText={setTripNotes}
          onSave={handleSave}
          isSaving={isSaving}
        />

        {/* ── View tabs + days ──────────────────────────────────────────── */}
        <ItineraryViewTabs
          viewTab={viewTab}
          onChangeTab={setViewTab}
          days={effectiveDays}
          activitiesByDay={activitiesByDay}
          collapsedDays={collapsedDays}
          onToggleDay={toggleDay}
          onAddActivity={addActivity}
          onEditActivity={updateActivity}
          onRemoveActivity={removeActivity}
          onUpdateDay={updateDay}
          onRemoveDay={removeDay}
          onAddDay={addDay}
          onUpdateActivityLocation={updateActivityLocation}
          isNew={isNew}
        destination={isNew ? draftDestination : destination}
          draftDayNotes={draftDayNotes}
          onChangeDraftDayNote={(dayId, note) =>
            setDraftDayNotes((prev) => ({
              ...prev,
              [dayId]: note,
            }))
          }
          onDraftActivitiesChange={(acts) => {
            draftActivitiesRef.current = acts;
          }}
        />

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
      )}

      {/* ── TravelInfo modal ─────────────────────────────────────────────── */}
      <TravelInfoFormModal
        visible={travelInfoModalVisible}
        editingItem={editingTravelInfo}
        onAdd={isNew ? handleDraftAddTravelInfo : addTravelInfo}
        onUpdate={isNew ? handleDraftUpdateTravelInfo : updateTravelInfo}
        onRemove={isNew ? handleDraftRemoveTravelInfo : removeTravelInfo}
        onClose={() => {
          setTravelInfoModalVisible(false);
          setEditingTravelInfo(null);
        }}
      />

      {/* ── Location map modal (OpenStreetMap picker, create mode only) ──────── */}
      {isNew && (
        <LocationMapModal
          visible={locationMapVisible}
          initialQuery={draftDestination}
          onSelect={setDraftDestination}
          onClose={() => setLocationMapVisible(false)}
          allowPointPick={false}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBarContainer: {
    width: '100%',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#44FFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  statusTime: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 21,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24,
  },
  logoDot: {
    color: '#44FFFF',
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 24,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goBackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  goBackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  iconCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitleText: {
    ...typography.lg,
    fontWeight: typography.weights.semibold,
    lineHeight: 28,
    color: '#18181B',
  },
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
    marginBottom: spacing.sm,
  },
  metaLocationWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  metaDateWrap: {
    width: '50%',
    alignItems: 'flex-start',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  card: {
    borderRadius: radii.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cardTitle: { ...typography.base, fontWeight: typography.weights.semibold },
  placeholderText: { ...typography.sm },
});
