import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { AppHeader, useThemeColor } from '@shared/ui-kit';
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
      accommodationLatitude: null,
      accommodationLongitude: null,
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
  accommodationLatitude: null,
  accommodationLongitude: null,
  activities: [{ id: 'draft-act-1-1', name: '', time: '', place: '', latitude: null, longitude: null, activityType: null }],
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function BuildYourselfWizard({ userId, currentUserName, currentUserAvatarUrl, onDone }: BuildYourselfWizardProps) {
  const { manualItineraryRepository } = useManualItineraryDependencies();

  const background = useThemeColor('background');

  // ── Step navigation ───────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  // Tracks the date range used the last time we built wizard days.
  // Days are only rebuilt when dates actually change — preserving edits on back/forward navigation.
  const daysBuiltForRef = useRef<{ start: string; end: string } | null>(null);

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

  // ── Sync days ↔ dates ────────────────────────────────────────────────────
  const handleDaysChange = useCallback((newDays: WizardDraftDay[]) => {
    setWizardDays(newDays);
    const datedDays = newDays.filter((d) => d.date != null);
    if (datedDays.length > 0) {
      const sorted = [...datedDays].sort((a, b) => a.date!.localeCompare(b.date!));
      const newStart = new Date(sorted[0].date!);
      const newEnd = new Date(sorted[sorted.length - 1].date!);
      setStartDate(newStart);
      setEndDate(newEnd);
      daysBuiltForRef.current = { start: toISODate(newStart), end: toISODate(newEnd) };
    }
  }, []);

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
    daysBuiltForRef.current = null;
  }, []);

  // ── Step navigation ───────────────────────────────────────────────────────

  const goToStep = useCallback(
    (next: number) => {
      if (next === 2 && startDate && endDate) {
        const startStr = toISODate(startDate);
        const endStr = toISODate(endDate);
        const prev = daysBuiltForRef.current;
        // Only rebuild days when the date range has changed — preserves edits on back/forward.
        if (!prev || prev.start !== startStr || prev.end !== endStr) {
          setWizardDays(buildDaysFromRange(startDate, endDate));
          daysBuiltForRef.current = { start: startStr, end: endStr };
        }
      }
      setCurrentStep(next);
    },
    [startDate, endDate],
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

      // 3. Save travel info items (Step 2) — non-fatal, skip on failure
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

      // 4. Save days, accommodation, and activities (Step 3).
      // If any day fails, roll back by deleting the itinerary (CASCADE removes all children).
      for (const day of wizardDays) {
        const dayResult = await manualItineraryRepository.addDay(itineraryId, {
          date:          day.date ?? undefined,
          accommodation: day.accommodation.trim() || null,
          accommodationLatitude:  day.accommodationLatitude ?? null,
          accommodationLongitude: day.accommodationLongitude ?? null,
        });

        if (!dayResult.success || !dayResult.id) {
          await manualItineraryRepository.remove(itineraryId);
          throw new Error('Failed to save trip days. Please try again.');
        }

        const dayId = dayResult.id;
        let sortOrder = 0;
        for (const act of day.activities) {
          if (!act.name.trim()) continue;
          // Activity failures are non-fatal — user can add them manually later.
          await manualItineraryRepository.addActivity(dayId, {
            name:         act.name.trim(),
            activityType: act.activityType ?? null,
            startTime:    act.time.trim()   || null,
            locationText: act.place.trim()  || null,
            latitude:     act.latitude      ?? null,
            longitude:    act.longitude     ?? null,
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

  return (
    <View style={[styles.root, { backgroundColor: background }]}>
      <AppHeader variant="wizard" onBack={handleCancel} />
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
            onDaysChange={handleDaysChange}
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
  stepContent: { flex: 1 },
});
