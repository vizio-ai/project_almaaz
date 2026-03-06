import React, { useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  AppText,
  PrimaryButton,
  ToggleRow,
  AccordionSection,
  CreatedByAuthor,
  useThemeColor,
  spacing,
  typography,
  radii,
} from '@shared/ui-kit';
import { AccommodationCard } from '../AccommodationCard';
import { ActivityCard } from '../ActivityCard';
import type { WizardDraftTravelInfo } from './WizardTravelInfoStep';
import type { WizardDraftDay, WizardActivityType } from './WizardTripPlanStep';

const PLACEHOLDER_IMAGE = require('../../../../../assets/images/card_photo.png');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start && !end) return '';
  if (!end) return start!.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (!start) return end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const sMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const eMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const year = end.getFullYear();
  if (sMonth === eMonth && start.getFullYear() === year) {
    return `${sMonth} ${start.getDate()}–${end.getDate()}, ${year}`;
  }
  return `${sMonth} ${start.getDate()} – ${eMonth} ${end.getDate()}, ${year}`;
}

function formatDaySubtitle(day: WizardDraftDay): string {
  if (!day.date) return '';
  const d = new Date(day.date);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric', year: 'numeric' });
}

function transportIcon(type: string): 'airplane-outline' | 'car-outline' | 'document-text-outline' {
  if (type === 'flight') return 'airplane-outline';
  if (type === 'rental_car') return 'car-outline';
  return 'document-text-outline';
}

function transportLabel(type: string): string {
  if (type === 'flight') return 'Airplane Travel';
  if (type === 'rental_car') return 'Rental Car';
  if (type === 'hotel') return 'Hotel';
  return 'Other';
}

function activityTypeLabel(type: WizardActivityType): string {
  switch (type) {
    case 'museum':   return 'Museum';
    case 'food':     return 'Food & Drink';
    case 'shopping': return 'Shopping';
    case 'historic': return 'Historic place';
    case 'beach':    return 'Beach';
    default:         return 'Park';
  }
}

function formatDateTimeShort(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  const year  = d.getFullYear();
  let hours   = d.getHours();
  const mins  = String(d.getMinutes()).padStart(2, '0');
  const ampm  = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${month}.${day}.${year} - ${hours}:${mins} ${ampm}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WizardConfirmationStepProps {
  coverUri: string | null;
  tripName: string;
  destination: string;
  startDate: Date | null;
  endDate: Date | null;
  tripNote: string;
  travelInfoItems: WizardDraftTravelInfo[];
  days: WizardDraftDay[];
  currentUserName?: string | null;
  currentUserAvatarUrl?: string | null;
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  isClonable: boolean;
  onIsClonableChange: (value: boolean) => void;
  isSaving: boolean;
  saveError: string | null;
  onBack: () => void;
  onSave: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WizardConfirmationStep({
  coverUri,
  tripName,
  destination,
  startDate,
  endDate,
  tripNote,
  travelInfoItems,
  days,
  currentUserName,
  currentUserAvatarUrl,
  isPublic,
  onIsPublicChange,
  isClonable,
  onIsClonableChange,
  isSaving,
  saveError,
  onBack,
  onSave,
}: WizardConfirmationStepProps) {
  const textColor  = useThemeColor('text');
  const secondary  = useThemeColor('textSecondary');
  const border     = useThemeColor('border');
  const background = useThemeColor('background');
  const surface    = useThemeColor('surface');

  const dateRange     = formatDateRange(startDate, endDate);
  const hasTransports = travelInfoItems.some((t) => t.title.trim());

  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(() => new Set());

  function toggleDay(dayId: string) {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TRIP PLAN label ──────────────────────────────────────── */}
        <AppText style={[styles.sectionLabel, { color: secondary }]}>TRIP PLAN</AppText>

        {/* ── Cover image ──────────────────────────────────────────── */}
        <Image
          source={coverUri ? { uri: coverUri } : PLACEHOLDER_IMAGE}
          style={styles.coverImage}
          resizeMode="cover"
        />

        {/* ── Action row ───────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.saveItineraryBtn, { borderColor: border }]}
            onPress={onSave}
            disabled={isSaving}
            activeOpacity={0.7}
          >
            <Ionicons name="bookmark-outline" size={15} color={textColor} />
            <AppText style={[styles.saveItineraryLabel, { color: textColor }]}>
              Save itinerary
            </AppText>
          </TouchableOpacity>
          <View style={styles.iconBtns}>
            <TouchableOpacity style={[styles.iconBtn, { borderColor: border }]} activeOpacity={0.7}>
              <Ionicons name="share-outline" size={18} color={textColor} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { borderColor: border }]} activeOpacity={0.7}>
              <Ionicons name="ellipsis-horizontal" size={18} color={textColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Trip header ──────────────────────────────────────────── */}
        <View style={styles.tripHeader}>
          <AppText style={[styles.tripTitle, { color: textColor }]}>
            {tripName.trim() || 'Untitled trip'}
          </AppText>

          <View style={styles.metaRow}>
            {destination.trim() ? (
              <>
                <Ionicons name="location-outline" size={14} color={secondary} />
                <AppText style={[styles.metaText, { color: secondary }]}>{destination}</AppText>
              </>
            ) : null}
            {dateRange ? (
              <>
                <Ionicons name="calendar-outline" size={14} color={secondary} />
                <AppText style={[styles.metaText, { color: secondary }]}>{dateRange}</AppText>
              </>
            ) : null}
          </View>

          {/* Creator row */}
          <CreatedByAuthor
            userName={currentUserName?.trim() || 'You'}
            avatarUrl={currentUserAvatarUrl ?? null}
          />
        </View>

        {/* ── Toggles (inline card) ────────────────────────────────── */}
        <View style={[styles.togglesCard, { backgroundColor: surface, borderColor: border }]}>
          <ToggleRow
            label="Allow other users to clone"
            value={isClonable}
            onValueChange={onIsClonableChange}
            infoMessage="This lets other users use your itinerary as a starting point to plan their own trip."
          />
          <View style={[styles.toggleDivider, { backgroundColor: border }]} />
          <ToggleRow
            label={isPublic ? 'Public itinerary' : 'Private itinerary'}
            value={isPublic}
            onValueChange={onIsPublicChange}
            infoMessage="When public, other users may see this itinerary in discover or shared views. When private, only you can see it."
          />
        </View>

        {/* ── Trip note ────────────────────────────────────────────── */}
        {tripNote.trim() ? (
          <View style={[styles.noteCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.noteHeader}>
              <AppText style={[styles.noteTitle, { color: textColor }]}>Note</AppText>
              <Ionicons name="ellipsis-horizontal" size={18} color={secondary} />
            </View>
            <AppText style={[styles.noteText, { color: secondary }]}>{tripNote}</AppText>
          </View>
        ) : null}

        {/* ── Travel information ───────────────────────────────────── */}
        {hasTransports ? (
          <View style={[styles.infoCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.infoCardHeader}>
              <AppText style={[styles.infoCardTitle, { color: textColor }]}>Travel Information</AppText>
              <Ionicons name="ellipsis-horizontal" size={18} color={secondary} />
            </View>
            {travelInfoItems
              .filter((t) => t.title.trim())
              .map((t) => (
                <View key={t.id} style={styles.transportRow}>
                  <Ionicons name={transportIcon(t.type)} size={15} color={secondary} />
                  <View style={styles.transportTexts}>
                    <AppText style={[styles.transportType, { color: textColor }]}>
                      {transportLabel(t.type)}
                    </AppText>
                    <AppText style={[styles.transportDetail, { color: secondary }]}>
                      {[t.title, t.startDatetime ? formatDateTimeShort(t.startDatetime) : null]
                        .filter(Boolean)
                        .join(' - ')}
                    </AppText>
                    {t.endDatetime ? (
                      <AppText style={[styles.transportDetail, { color: secondary }]}>
                        {[t.provider, formatDateTimeShort(t.endDatetime)]
                          .filter(Boolean)
                          .join(' - ')}
                      </AppText>
                    ) : null}
                    {t.detail ? (
                      <AppText style={[styles.transportDetail, { color: secondary }]} numberOfLines={1}>
                        {t.detail}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              ))}
          </View>
        ) : null}

        {/* ── Day plan ─────────────────────────────────────────────── */}
        <View style={styles.daysContainer}>
          {days.map((day) => {
            const filledActivities = day.activities.filter((a) => a.name.trim());
            const hasContent = day.accommodation.trim() || filledActivities.length > 0;
            if (!hasContent) return null;

            return (
              <AccordionSection
                key={day.id}
                title={`Day ${day.dayNumber}`}
                subtitle={formatDaySubtitle(day)}
                collapsed={collapsedDays.has(day.id)}
                onToggle={() => toggleDay(day.id)}
              >
                <View style={styles.dayContent}>
                  {day.accommodation.trim() ? (
                    <AccommodationCard title={day.accommodation} />
                  ) : null}

                  {filledActivities.map((act) => (
                    <ActivityCard
                      key={act.id}
                      title={act.name}
                      tags={[
                        ...(act.activityType
                          ? [{ label: activityTypeLabel(act.activityType), icon: 'type' as const }]
                          : []),
                        ...(act.place.trim()
                          ? [{ label: act.place, icon: 'location' as const }]
                          : []),
                        ...(act.time.trim()
                          ? [{ label: act.time, icon: 'time' as const }]
                          : []),
                      ]}
                    />
                  ))}
                </View>
              </AccordionSection>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Save error ─────────────────────────────────────────────── */}
      {saveError ? (
        <View style={styles.errorBanner}>
          <AppText style={styles.errorText}>{saveError}</AppText>
        </View>
      ) : null}

      {/* ── Bottom action bar ──────────────────────────────────────── */}
      <View style={[styles.bottomBar, { borderTopColor: border, backgroundColor: background }]}>
        <PrimaryButton
          variant="outline"
          label="Back"
          onPress={onBack}
          disabled={isSaving}
          style={styles.actionBtn}
        />
        <PrimaryButton
          label="Save itinerary"
          onPress={onSave}
          isLoading={isSaving}
          style={styles.actionBtn}
        />
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingBottom: spacing['2xl'] },

  // TRIP PLAN label
  sectionLabel: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },

  // Cover
  coverImage: {
    width: '100%',
    height: 200,
  },

  // Action row below cover
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  saveItineraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  saveItineraryLabel: {
    ...typography.sm,
    fontWeight: '500',
  },
  iconBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Trip header
  tripHeader: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  tripTitle: {
    ...typography['2xl'],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  metaText: { ...typography.sm },

  // Toggles card
  togglesCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  toggleDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },

  // Note card
  noteCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noteTitle: {
    ...typography.sm,
    fontWeight: '600',
  },
  noteText: { ...typography.sm },

  // Travel info card
  infoCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCardTitle: {
    ...typography.sm,
    fontWeight: '600',
  },
  transportRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  transportTexts: { flex: 1 },
  transportType: { ...typography.sm, fontWeight: '500' },
  transportDetail: { ...typography.caption },

  // Days
  daysContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  dayContent: {
    gap: spacing.md,
  },

  // Error banner
  errorBanner: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    ...typography.sm,
    color: '#DC2626',
  },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: { flex: 1 },
});
