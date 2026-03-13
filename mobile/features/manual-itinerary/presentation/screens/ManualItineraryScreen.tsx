import React, { useState, useCallback, useRef, useImperativeHandle } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AppHeader,
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
import { BuildYourselfWizard } from './BuildYourselfWizard';
import { useActivityMutations } from '../hooks/useActivityMutations';
import { useDayMutations } from '../hooks/useDayMutations';
import { useTravelInfoMutations } from '../hooks/useTravelInfoMutations';
import { useManualItineraryDependencies } from '../../di/ManualItineraryProvider';
import { useAutoSummary } from '../hooks/useAutoSummary';
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

export interface ManualItineraryScreenRef {
  /** Triggers the unsaved-changes guard and navigates back if confirmed. */
  requestClose: () => void;
}

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
  onBack?: () => void;
  onSaveSuccess?: () => void;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  const endStr = toISODate(endDate);
  for (
    let d = new Date(startDate);
    toISODate(d) <= endStr;
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

export const ManualItineraryScreen = React.forwardRef<
  ManualItineraryScreenRef,
  ManualItineraryScreenProps
>(function ManualItineraryScreen({
  itineraryId,
  userId,
  currentUserName,
  currentUserAvatarUrl,
  showHeader = true,
  onBack,
  onSaveSuccess,
}: ManualItineraryScreenProps, ref) {
  const isNew = itineraryId === null;

  const { itinerary, days, activities, travelInfo, isLoading, error, refresh } =
    useGetItinerary(itineraryId);
  const { manualItineraryRepository } = useManualItineraryDependencies();
  const { addActivity, updateActivity, removeActivity, updateActivityLocation, reorderActivities } = useActivityMutations(refresh);
  const { addDay, updateDay, removeDay, reorderDays } = useDayMutations(itineraryId, refresh);
  const { addTravelInfo, updateTravelInfo, removeTravelInfo } = useTravelInfoMutations(
    itineraryId,
    refresh,
  );
  const { isGenerating: isGeneratingSummary, triggerSummary } = useAutoSummary(itineraryId, refresh);

  // ── Create mode state ──────────────────────────────────────────────────────
  const [draftCoverUri, setDraftCoverUri] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDestination, setDraftDestination] = useState('');
  const [draftStartDate, setDraftStartDate] = useState<Date | null>(null);
  const [draftEndDate, setDraftEndDate] = useState<Date | null>(null);
  const [editStartDate, setEditStartDate] = useState<Date | null>(null);
  const [editEndDate, setEditEndDate] = useState<Date | null>(null);
  const [draftTravelInfo, setDraftTravelInfo] = useState<TravelInfo[]>([]);
  const [draftDayNotes, setDraftDayNotes] = useState<Record<string, string>>({});
  const draftActivitiesRef = useRef<Record<string, { name: string; locationText: string | null }[]>>({});
  const draftAccommodationRef = useRef<Record<string, { name: string | null; latitude?: number | null; longitude?: number | null }>>({});

  // ── Shared state (create + edit) ──────────────────────────────────────────
  const [isPublic, setIsPublic] = useState(false);
  const [isClonable, setIsClonable] = useState(false);

  // ── Edit mode state ───────────────────────────────────────────────────────
  const [editTitle, setEditTitle] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editCoverUri, setEditCoverUri] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<ViewTab>('detailed');
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());
  const [tripNotes, setTripNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleSaveNotes = useCallback(async () => {
    if (isNew) return;
    setIsSavingNotes(true);
    try {
      await manualItineraryRepository.update(itineraryId!, { tripNotes: tripNotes || null });
      refresh();
    } finally {
      setIsSavingNotes(false);
    }
  }, [isNew, itineraryId, tripNotes, manualItineraryRepository, refresh]);

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
    setEditStartDate(itinerary.startDate ? new Date(itinerary.startDate) : null);
    setEditEndDate(itinerary.endDate ? new Date(itinerary.endDate) : null);
    setEditTitle(itinerary.title ?? '');
    setEditDestination(itinerary.destination ?? '');
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

  /**
   * Adds the next day in sequence and keeps the itinerary end date in sync.
   * Advancing rule: last dated day + 1 → if no dates yet, adds a dateless day.
   */
  const handleAddDay = useCallback(async () => {
    if (!itineraryId) return;

    const sortedDays = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
    const lastDatedDay = [...sortedDays].reverse().find((d) => !!d.date);

    let newDateStr: string | null = null;

    if (lastDatedDay?.date) {
      // Advance last known date by 1 UTC day
      const d = new Date(lastDatedDay.date);
      d.setUTCDate(d.getUTCDate() + 1);
      newDateStr = toISODate(d);
    } else if (editEndDate) {
      const d = new Date(editEndDate.getTime());
      d.setUTCDate(d.getUTCDate() + 1);
      newDateStr = toISODate(d);
    }

    if (newDateStr) {
      // Keep the displayed date range consistent with the new day count
      const newEnd = new Date(newDateStr);
      await manualItineraryRepository.update(itineraryId, { endDate: newDateStr });
      setEditEndDate(newEnd);
    }

    await addDay({ date: newDateStr ?? undefined });
  }, [itineraryId, days, editEndDate, manualItineraryRepository, addDay]);

  /**
   * Removes a day and keeps the itinerary end date in sync.
   * The new end date is the date of the last remaining dated day.
   */
  const handleRemoveDay = useCallback(async (dayId: string) => {
    const result = await manualItineraryRepository.clearDay(dayId);
    if (!result.success) return;
    refresh();
  }, [manualItineraryRepository, refresh]);

  // ── Wrap mutations to trigger summary generation ────────────────────────
  const addActivityWithSummary = useCallback(
    async (dayId: string, params: import('../../domain/repository/ManualItineraryRepository').AddActivityParams) => {
      const result = await addActivity(dayId, params);
      if (result.success) triggerSummary();
      return result;
    },
    [addActivity, triggerSummary],
  );

  const updateActivityWithSummary = useCallback(
    async (activityId: string, params: import('../../domain/repository/ManualItineraryRepository').UpdateActivityParams) => {
      const result = await updateActivity(activityId, params);
      if (result.success) triggerSummary();
      return result;
    },
    [updateActivity, triggerSummary],
  );

  const removeActivityWithSummary = useCallback(
    async (activityId: string) => {
      const result = await removeActivity(activityId);
      if (result.success) triggerSummary();
      return result;
    },
    [removeActivity, triggerSummary],
  );

  const updateDayWithSummary = useCallback(
    async (dayId: string, params: import('../../domain/repository/ManualItineraryRepository').UpdateDayParams) => {
      const result = await updateDay(dayId, params);
      if (result.success) triggerSummary();
      return result;
    },
    [updateDay, triggerSummary],
  );

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
              const accData = draftAccommodationRef.current[day.id];
              const dayResult = await manualItineraryRepository.addDay(result.id, {
                date: day.date,
                notes: note,
                accommodation: accData?.name?.trim() || null,
                accommodationLatitude: accData?.latitude ?? null,
                accommodationLongitude: accData?.longitude ?? null,
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

            // Save draft accommodations as hotel TravelInfo items
            for (const day of draftDays) {
              const accData = draftAccommodationRef.current[day.id];
              if (accData?.name?.trim()) {
                await manualItineraryRepository.addTravelInfo(result.id, {
                  type: 'hotel',
                  title: accData.name.trim(),
                });
              }
            }
          }

          // Reset draft state so the form is clean next time
          setDraftTitle('');
          setDraftDestination('');
          setDraftStartDate(null);
          setDraftEndDate(null);
          setDraftCoverUri(null);
          setDraftTravelInfo([]);
          setDraftDayNotes({});
          setTripNotes('');
          setIsPublic(false);
          setIsClonable(false);
          draftActivitiesRef.current = {};
          draftAccommodationRef.current = {};

          onBack?.();
        }
      } else {
        let newCoverUrl: string | undefined;
        if (editCoverUri) {
          const upload = await manualItineraryRepository.uploadCoverImage(
            userId,
            itineraryId!,
            editCoverUri,
          );
          if (upload.success && upload.url) {
            newCoverUrl = upload.url;
          }
        }

        const result = await manualItineraryRepository.update(itineraryId!, {
          title: editTitle.trim() || 'Untitled trip',
          destination: editDestination.trim(),
          startDate: editStartDate ? toISODate(editStartDate) : null,
          endDate: editEndDate ? toISODate(editEndDate) : null,
          tripNotes: tripNotes || null,
          isPublic,
          isClonable,
          ...(newCoverUrl ? { coverImageUrl: newCoverUrl } : {}),
        });
        if (result.success) {
          refresh();
          onSaveSuccess?.();
        }
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
    editCoverUri,
    editTitle,
    editDestination,
    editStartDate,
    editEndDate,
    tripNotes,
    isPublic,
    isClonable,
    manualItineraryRepository,
    draftDayNotes,
    refresh,
    onBack,
  ]);

  // ── Unsaved changes guard ─────────────────────────────────────────────────

  const hasUnsavedChanges = React.useMemo(() => {
    if (isNew) {
      return !!(draftTitle || draftDestination || draftStartDate || draftCoverUri);
    }
    if (!itinerary) return false;
    return (
      editTitle !== (itinerary.title ?? '') ||
      editDestination !== (itinerary.destination ?? '') ||
      editCoverUri !== null ||
      (tripNotes || '') !== (itinerary.tripNotes ?? '') ||
      isPublic !== (itinerary.isPublic ?? false) ||
      isClonable !== (itinerary.isClonable ?? false)
    );
  }, [
    isNew, itinerary, draftTitle, draftDestination, draftStartDate, draftCoverUri,
    editTitle, editDestination, editCoverUri, tripNotes, isPublic, isClonable,
  ]);

  const handleBack = useCallback(() => {
    if (!onBack) return;
    if (isNew || !hasUnsavedChanges) {
      onBack();
      return;
    }
    Alert.alert(
      'Unsaved changes',
      'You have unsaved changes. Would you like to save before leaving?',
      [
        { text: 'Discard', style: 'destructive', onPress: onBack },
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', onPress: async () => { await handleSave(); } },
      ],
    );
  }, [onBack, hasUnsavedChanges, handleSave]);

  useImperativeHandle(
    ref,
    () => ({ requestClose: isNew ? (onBack ?? (() => {})) : handleBack }),
    [isNew, onBack, handleBack],
  );

  // ── Share ─────────────────────────────────────────────────────────────────

  const doShare = useCallback(() => {
    const title = itinerary?.title || editTitle || 'My Trip';
    const destination = itinerary?.destination || editDestination;
    const start = itinerary?.startDate ?? null;
    const end = itinerary?.endDate ?? null;

    let message = title;
    if (destination) message += `\nDestination: ${destination}`;
    if (start && end) message += `\nDates: ${formatDate(start)} – ${formatDate(end)}`;
    else if (start) message += `\nDate: ${formatDate(start)}`;

    Share.share({ title, message });
  }, [itinerary, editTitle, editDestination]);

  const handleShare = useCallback(() => {
    if (isNew) {
      Alert.alert('Save first', 'Save your itinerary before sharing it.');
      return;
    }
    if (!isPublic) {
      Alert.alert(
        'Private itinerary',
        'This itinerary is private. Make it public to share it.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Make Public & Share',
            onPress: async () => {
              await manualItineraryRepository.update(itineraryId!, { isPublic: true });
              setIsPublic(true);
              refresh();
              doShare();
            },
          },
        ],
      );
      return;
    }
    doShare();
  }, [isNew, isPublic, itineraryId, manualItineraryRepository, refresh, doShare]);

  // ── Clone ────────────────────────────────────────────────────────────────

  const handleClone = useCallback(async () => {
    if (!itineraryId) return;
    Alert.alert(
      'Clone itinerary',
      'This will create a copy of this itinerary in your trips.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clone',
          onPress: async () => {
            const result = await manualItineraryRepository.cloneItinerary(itineraryId, userId);
            if (result.success) {
              Alert.alert('Cloned', 'The itinerary has been cloned to your trips.');
            } else {
              Alert.alert('Error', 'Could not clone this itinerary.');
            }
          },
        },
      ],
    );
  }, [itineraryId, userId, manualItineraryRepository]);

  // ── More options (delete + clone) ───────────────────────────────────────

  const handleMoreOptions = useCallback(() => {
    Alert.alert(
      'Options',
      undefined,
      [
        {
          text: 'Clone itinerary',
          onPress: handleClone,
        },
        {
          text: 'Delete itinerary',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete itinerary',
              'Are you sure? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    await manualItineraryRepository.remove(itineraryId!);
                    onBack?.();
                  },
                },
              ],
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }, [itineraryId, manualItineraryRepository, onBack, handleClone]);

  // ── Derived values ────────────────────────────────────────────────────────

  const isOwner = isNew || (!!itinerary?.userId && itinerary.userId === userId);
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

  const headerActions = isOwner ? (
    <HeaderActions
      onSave={handleSave}
      saveLabel="Save changes"
      isSaving={isSaving}
      onShare={handleShare}
      onMoreOptions={!isNew ? handleMoreOptions : undefined}
    />
  ) : (
    <HeaderActions
      onShare={handleShare}
      onClone={isClonable ? handleClone : undefined}
    />
  );

  // ── Render ────────────────────────────────────────────────────────────────

  // Create mode → hand off entirely to the multi-step wizard
  if (isNew) {
    return (
      <BuildYourselfWizard
        userId={userId}
        currentUserName={currentUserName}
        currentUserAvatarUrl={currentUserAvatarUrl}
        onDone={onBack ?? (() => {})}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      {showHeader && (
        <AppHeader
          variant="dark"
          right={
            onBack ? (
              <TouchableOpacity style={styles.goBackPill} onPress={handleBack} activeOpacity={0.8}>
                <Ionicons name="chevron-back-outline" size={16} color="#FFFFFF" />
                <AppText style={styles.goBackText}>Go back</AppText>
              </TouchableOpacity>
            ) : undefined
          }
        />
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
          imageUri={isNew ? draftCoverUri : (editCoverUri ?? coverImageUrl)}
          onChange={isOwner ? (isNew ? setDraftCoverUri : setEditCoverUri) : undefined}
          editable={isOwner}
        />

        {/* ── Trip title ────────────────────────────────────────────────── */}
        <View style={styles.titleWrap}>
          <TripTitleInput
            value={isNew ? draftTitle : editTitle}
            onChange={isOwner ? (isNew ? setDraftTitle : setEditTitle) : undefined}
          />
        </View>

        {/* ── Location + Date row ───────────────────────────────────────── */}
        <View style={styles.metaInfoRow}>
          <View style={styles.metaLocationWrap}>
            <TripLocationInput
              value={isNew ? draftDestination : editDestination}
              onChange={isOwner ? (isNew ? setDraftDestination : setEditDestination) : undefined}
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
            ) : (
              <TripDateRangeInput
                startDate={editStartDate}
                endDate={editEndDate}
                onStartDate={isOwner ? setEditStartDate : undefined}
                onEndDate={isOwner ? setEditEndDate : undefined}
                displayText={formatDateRange(startDate, editEndDate ? toISODate(editEndDate) : (itinerary?.endDate ?? null))}
              />
            )}
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
        {isOwner && (
        <ToggleRow
          label="Allow other users to clone"
          value={isClonable}
          onValueChange={setIsClonable}
          infoMessage="This lets other users use your itinerary as a starting point to plan their own trip"
        />
        )}

        {/* ── Public / Private visibility ───────────────────────────────── */}
        {isOwner && (
        <ToggleRow
          label={isPublic ? 'Public itinerary' : 'Private itinerary'}
          value={isPublic}
          onValueChange={setIsPublic}
          infoMessage="When public, other users may see this itinerary in discover or shared views. When private, only you can see it."
        />
        )}

        {/* ── Travel Information ────────────────────────────────────────── */}
        <TravelInfoSection
          items={isNew ? draftTravelInfo : travelInfo}
          onAddPress={isOwner ? () => {
            setEditingTravelInfo(null);
            setTravelInfoModalVisible(true);
          } : undefined}
          onEditItem={isOwner ? (t) => {
            setEditingTravelInfo(t);
            setTravelInfoModalVisible(true);
          } : undefined}
        />

        {/* ── Notes ─────────────────────────────────────────────────────── */}
        <TripNotesSection
          value={tripNotes}
          onChangeText={isOwner ? setTripNotes : () => {}}
          onSave={handleSaveNotes}
          isSaving={isSavingNotes}
          readOnly={!isOwner}
        />

        {/* ── View tabs + days ──────────────────────────────────────────── */}
        <ItineraryViewTabs
          viewTab={viewTab}
          onChangeTab={setViewTab}
          days={effectiveDays}
          activitiesByDay={activitiesByDay}
          collapsedDays={collapsedDays}
          onToggleDay={toggleDay}
          onAddActivity={addActivityWithSummary}
          onEditActivity={updateActivityWithSummary}
          onRemoveActivity={removeActivityWithSummary}
          onUpdateDay={updateDayWithSummary}
          onRemoveDay={handleRemoveDay}
          onAddDay={handleAddDay}
          onUpdateActivityLocation={updateActivityLocation}
          onReorderActivities={reorderActivities}
          isNew={isNew}
          destination={isNew ? draftDestination : editDestination}
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
          onDraftAccommodationChange={(acc) => {
            draftAccommodationRef.current = acc;
          }}
          onReorderDays={reorderDays}
          readOnly={!isOwner}
          isAiGenerated={itinerary?.isAiGenerated}
          isGeneratingSummary={isGeneratingSummary}
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

      {/* ── Location map modal (OpenStreetMap picker) ──────── */}
      <LocationMapModal
        visible={locationMapVisible}
        initialQuery={isNew ? draftDestination : editDestination}
        onSelect={isNew ? setDraftDestination : setEditDestination}
        onClose={() => setLocationMapVisible(false)}
        allowPointPick={false}
      />
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
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
