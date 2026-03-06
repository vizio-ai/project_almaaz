import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { AppText, useThemeColor, spacing, typography } from '@shared/ui-kit';
import { useManualItineraryDependencies } from '../../di/ManualItineraryProvider';
import { WizardStepper } from '../components/wizard/WizardStepper';
import { WizardBasicDetailsStep } from '../components/wizard/WizardBasicDetailsStep';
import { WizardTravelInfoStep, type WizardDraftTravelInfo } from '../components/wizard/WizardTravelInfoStep';
import { WizardTripPlanStep, type WizardDraftDay } from '../components/wizard/WizardTripPlanStep';
import { WizardConfirmationStep } from '../components/wizard/WizardConfirmationStep';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BuildYourselfWizardProps {
  userId: string;
  currentUserName?: string | null;
  currentUserAvatarUrl?: string | null;
  onDone: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function buildDaysFromRange(start: Date, end: Date): WizardDraftDay[] {
  const days: WizardDraftDay[] = [];
  let index = 1;
  for (
    let d = new Date(start);
    d <= end;
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000), index += 1
  ) {
    days.push({
      id: `draft-day-${index}`,
      dayNumber: index,
      date: toISODate(d),
      accommodation: '',
      activities: [
        { id: `draft-act-${index}-1`, name: '', time: '', place: '', latitude: null, longitude: null, activityType: null },
      ],
    });
  }
  return days;
}

const EMPTY_DAY: WizardDraftDay = {
  id: 'draft-day-1',
  dayNumber: 1,
  date: null,
  accommodation: '',
  activities: [{ id: 'draft-act-1-1', name: '', time: '', place: '', latitude: null, longitude: null, activityType: null }],
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function BuildYourselfWizard({ userId, currentUserName, currentUserAvatarUrl, onDone }: BuildYourselfWizardProps) {
  const { manualItineraryRepository } = useManualItineraryDependencies();

  const textColor  = useThemeColor('text');
  const background = useThemeColor('background');

  // ── Step navigation ───────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);

  // ── Step 1 – Basic Details ────────────────────────────────────────────────
  const [coverUri,    setCoverUri]    = useState<string | null>(null);
  const [tripName,    setTripName]    = useState('');
  const [destination, setDestination] = useState('');
  const [startDate,   setStartDate]   = useState<Date | null>(null);
  const [endDate,     setEndDate]     = useState<Date | null>(null);
  const [tripNote,    setTripNote]    = useState('');

  // ── Step 2 – Travel Information ───────────────────────────────────────────
  const [travelInfoItems, setTravelInfoItems] = useState<WizardDraftTravelInfo[]>([]);

  // ── Step 3 – Trip Plan ────────────────────────────────────────────────────
  const [wizardDays, setWizardDays] = useState<WizardDraftDay[]>([EMPTY_DAY]);

  // ── Step 4 – Confirmation settings ───────────────────────────────────────
  const [isPublic,   setIsPublic]   = useState(false);
  const [isClonable, setIsClonable] = useState(false);

  // ── Saving ────────────────────────────────────────────────────────────────
  const [isSaving,  setIsSaving]  = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── State reset ───────────────────────────────────────────────────────────

  const resetWizardState = useCallback(() => {
    setCurrentStep(0);
    setCoverUri(null);
    setTripName('');
    setDestination('');
    setStartDate(null);
    setEndDate(null);
    setTripNote('');
    setTravelInfoItems([]);
    setWizardDays([EMPTY_DAY]);
    setIsPublic(false);
    setIsClonable(false);
    setSaveError(null);
  }, []);

  // ── Step navigation ───────────────────────────────────────────────────────

  const goToStep = useCallback(
    (next: number) => {
      // Auto-populate days from date range when first entering Trip Plan
      if (next === 2 && next > currentStep && startDate && endDate) {
        setWizardDays(buildDaysFromRange(startDate, endDate));
      }
      setCurrentStep(next);
    },
    [currentStep, startDate, endDate],
  );

  const handleCancel = useCallback(() => {
    resetWizardState();
    onDone();
  }, [resetWizardState, onDone]);

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // 1. Create the base itinerary record
      const result = await manualItineraryRepository.create({
        userId,
        title:         tripName.trim() || 'Untitled trip',
        destination:   destination.trim(),
        startDate:     startDate ? toISODate(startDate) : null,
        endDate:       endDate   ? toISODate(endDate)   : null,
        tripNotes:     tripNote.trim() || null,
        isPublic,
        isClonable,
        isAiGenerated: false,
      });

      if (!result.success || !result.id) {
        const msg = 'Failed to create trip. Please try again.';
        setSaveError(msg);
        Alert.alert('Save failed', msg);
        return;
      }
      const itineraryId = result.id;

      // 2. Upload cover image (non-fatal)
      if (coverUri) {
        try {
          const upload = await manualItineraryRepository.uploadCoverImage(userId, itineraryId, coverUri);
          if (upload.success && upload.url) {
            await manualItineraryRepository.update(itineraryId, { coverImageUrl: upload.url });
          }
        } catch {
          // Cover upload failure is non-fatal
        }
      }

      // 3. Save travel info items (Step 2) with full structured data
      for (const ti of travelInfoItems) {
        if (ti.title.trim()) {
          await manualItineraryRepository.addTravelInfo(itineraryId, {
            type:          ti.type,
            title:         ti.title.trim(),
            provider:      ti.provider      || null,
            detail:        ti.detail        || null,
            startDatetime: ti.startDatetime || null,
            endDatetime:   ti.endDatetime   || null,
          });
        }
      }

      // 4. Save days, accommodation, and activities (Step 3)
      for (const day of wizardDays) {
        const dayResult = await manualItineraryRepository.addDay(itineraryId, {
          date: day.date ?? undefined,
        });
        if (!dayResult.success || !dayResult.id) continue;
        const dayId = dayResult.id;

        if (day.accommodation.trim()) {
          await manualItineraryRepository.addTravelInfo(itineraryId, {
            type:  'hotel',
            title: day.accommodation.trim(),
          });
        }

        let sortOrder = 0;
        for (const act of day.activities) {
          if (!act.name.trim()) continue;
          const name = act.time.trim()
            ? `[${act.time.trim()}] ${act.name.trim()}`
            : act.name.trim();
          await manualItineraryRepository.addActivity(dayId, {
            name,
            locationText: act.place.trim() || null,
            latitude:     act.latitude     ?? null,
            longitude:    act.longitude    ?? null,
            sortOrder:    sortOrder++,
          });
        }
      }

      resetWizardState();
      onDone();
    } catch (e) {
      const msg = e instanceof Error
        ? e.message
        : 'Network error. Please check your connection and try again.';
      setSaveError(msg);
      Alert.alert('Save failed', msg);
    } finally {
      setIsSaving(false);
    }
  }, [
    userId, tripName, destination, startDate, endDate, tripNote,
    isPublic, isClonable, coverUri, travelInfoItems, wizardDays,
    manualItineraryRepository, onDone, resetWizardState,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────

  const screenTitle = currentStep === 0 ? 'Plan a trip from scratch' : 'Build Your Own Itinerary';

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      <View style={styles.titleRow}>
        <AppText style={[styles.title, { color: textColor }]}>{screenTitle}</AppText>
      </View>

      <WizardStepper currentStep={currentStep} />

      <View style={styles.stepContent}>
        {currentStep === 0 && (
          <WizardBasicDetailsStep
            coverUri={coverUri}
            onCoverChange={setCoverUri}
            onCoverDelete={() => setCoverUri(null)}
            tripName={tripName}
            onTripNameChange={setTripName}
            destination={destination}
            onDestinationChange={setDestination}
            startDate={startDate}
            endDate={endDate}
            onStartDate={setStartDate}
            onEndDate={setEndDate}
            tripNote={tripNote}
            onTripNoteChange={setTripNote}
            isPublic={isPublic}
            onIsPublicChange={setIsPublic}
            isClonable={isClonable}
            onIsClonableChange={setIsClonable}
            onCancel={handleCancel}
            onNext={() => goToStep(1)}
          />
        )}

        {currentStep === 1 && (
          <WizardTravelInfoStep
            travelInfoItems={travelInfoItems}
            onTravelInfoChange={setTravelInfoItems}
            onBack={() => goToStep(0)}
            onNext={() => goToStep(2)}
          />
        )}

        {currentStep === 2 && (
          <WizardTripPlanStep
            days={wizardDays}
            onDaysChange={setWizardDays}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
          />
        )}

        {currentStep === 3 && (
          <WizardConfirmationStep
            coverUri={coverUri}
            tripName={tripName}
            destination={destination}
            startDate={startDate}
            endDate={endDate}
            tripNote={tripNote}
            travelInfoItems={travelInfoItems}
            days={wizardDays}
            currentUserName={currentUserName}
            currentUserAvatarUrl={currentUserAvatarUrl}
            isPublic={isPublic}
            onIsPublicChange={setIsPublic}
            isClonable={isClonable}
            onIsClonableChange={setIsClonable}
            isSaving={isSaving}
            saveError={saveError}
            onBack={() => goToStep(2)}
            onSave={handleSave}
          />
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  titleRow: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xs,
  },
  title: {
    ...typography['2xl'],
    fontWeight: '700',
  },
  stepContent: { flex: 1 },
});
