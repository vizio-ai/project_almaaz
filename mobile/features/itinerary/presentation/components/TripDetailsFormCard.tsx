import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@shared/ui-kit';
import { geocodingService, type PlaceSuggestion } from '@shared/services';
import { BudgetSelectionPills } from './BudgetSelectionPills';
import type { BudgetLevel, TripFormData, FormSuggestions } from '../../domain/entities/ChatSession';

interface TripDetailsFormCardProps {
  suggestions?: FormSuggestions | null;
  onSubmit: (data: TripFormData) => void;
  disabled?: boolean;
}

type DatePickerStep = 'start' | 'end' | null;

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function TripDetailsFormCard({
  suggestions,
  onSubmit,
  disabled,
}: TripDetailsFormCardProps) {
  const [title, setTitle] = useState(suggestions?.title ?? '');
  const [destination, setDestination] = useState(suggestions?.destination ?? '');
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLng, setDestinationLng] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [budget, setBudget] = useState<BudgetLevel | null>(null);

  // Autocomplete state
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Date picker state
  const [pickerStep, setPickerStep] = useState<DatePickerStep>(null);
  const [localDate, setLocalDate] = useState(new Date());

  const canSubmit =
    title.trim().length > 0 &&
    destination.trim().length > 0 &&
    startDate !== null &&
    endDate !== null &&
    budget !== null;

  const handleSubmit = () => {
    if (!canSubmit || !budget || !startDate || !endDate) return;
    onSubmit({
      title: title.trim(),
      destination: destination.trim(),
      destinationLat,
      destinationLng,
      startDate: toISODate(startDate),
      endDate: toISODate(endDate),
      budget,
    });
  };

  // ── Destination autocomplete ───────────────────────────────

  const fetchPlaceSuggestions = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setPlaceSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearching(true);
    try {
      const items = await geocodingService.autocomplete(text);
      setPlaceSuggestions(items);
      setShowSuggestions(items.length > 0);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleDestinationChange = useCallback(
    (text: string) => {
      setDestination(text);
      setDestinationLat(null);
      setDestinationLng(null);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchPlaceSuggestions(text), 350);
    },
    [fetchPlaceSuggestions],
  );

  const handleSelectPlace = useCallback((place: PlaceSuggestion) => {
    setDestination(place.label);
    setDestinationLat(place.lat);
    setDestinationLng(place.lng);
    setPlaceSuggestions([]);
    setShowSuggestions(false);
    Keyboard.dismiss();
  }, []);

  // ── Date picker logic ──────────────────────────────────────

  const openDatePicker = () => {
    Keyboard.dismiss();
    setLocalDate(startDate ?? new Date());
    setPickerStep('start');
  };

  const handleDateConfirm = () => {
    if (pickerStep === 'start') {
      setStartDate(localDate);
      if (endDate && endDate < localDate) setEndDate(null);
      setLocalDate(endDate && endDate >= localDate ? endDate : localDate);
      setPickerStep('end');
    } else if (pickerStep === 'end') {
      setEndDate(localDate);
      setPickerStep(null);
    }
  };

  const handleDateDismiss = () => {
    setPickerStep(null);
  };

  const dateLabel = startDate && endDate
    ? `${formatDate(startDate)} — ${formatDate(endDate)}`
    : 'Pick a date';

  const dateStepLabel = pickerStep === 'start' ? 'Start date' : 'End date';
  const minimumDate = pickerStep === 'end' ? (startDate ?? undefined) : undefined;

  return (
    <View style={styles.card}>
      {/* Trip Name */}
      <View style={styles.fieldWrap}>
        <View style={styles.field}>
          <AppText style={styles.label}>Trip Name</AppText>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputText}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Tuscany Adventure"
              placeholderTextColor="#71717A"
            />
          </View>
        </View>
      </View>

      {/* Destination with autocomplete */}
      <View style={styles.fieldWrap}>
        <View style={styles.field}>
          <AppText style={styles.label}>Destination</AppText>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.inputText}
              value={destination}
              onChangeText={handleDestinationChange}
              placeholder="Destination"
              placeholderTextColor="#71717A"
              onFocus={() => {
                if (placeSuggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                // Delay hiding so tap on suggestion can register
                setTimeout(() => setShowSuggestions(false), 200);
              }}
            />
            {searching ? (
              <ActivityIndicator size="small" color="#71717A" />
            ) : (
              <Ionicons name="chevron-down" size={16} color="#71717A" />
            )}
          </View>

          {/* Suggestions dropdown */}
          {showSuggestions && (
            <ScrollView
              style={styles.suggestionsContainer}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {placeSuggestions.map((place, idx) => (
                <TouchableOpacity
                  key={place.placeId ?? idx}
                  style={[
                    styles.suggestionItem,
                    idx < placeSuggestions.length - 1 && styles.suggestionItemBorder,
                  ]}
                  onPress={() => handleSelectPlace(place)}
                >
                  <Ionicons name="location-outline" size={14} color="#71717A" />
                  <AppText style={styles.suggestionText} numberOfLines={2}>
                    {place.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      {/* Dates */}
      <View style={styles.fieldWrap}>
        <View style={styles.field}>
          <AppText style={styles.label}>Set Your Dates</AppText>
          <TouchableOpacity
            style={styles.dateTrigger}
            onPress={openDatePicker}
            activeOpacity={0.7}
          >
            <Ionicons name="calendar-outline" size={16} color="#71717A" />
            <AppText
              style={[
                styles.dateTriggerText,
                !startDate && { color: '#71717A' },
              ]}
            >
              {dateLabel}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Budget */}
      <View style={styles.fieldWrap}>
        <View style={styles.field}>
          <AppText style={styles.label}>Budget Selection</AppText>
          <BudgetSelectionPills selected={budget} onSelect={setBudget} />
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (!canSubmit || disabled) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        activeOpacity={0.8}
        disabled={!canSubmit || disabled}
      >
        <AppText style={styles.submitBtnText}>Submit</AppText>
      </TouchableOpacity>

      {/* ── Date Picker ──────────────────────────────────────── */}
      {pickerStep !== null &&
        (Platform.OS === 'android' ? (
          <DateTimePicker
            key={pickerStep}
            value={localDate}
            mode="date"
            display="default"
            minimumDate={minimumDate}
            onChange={(_, date) => {
              if (date) {
                setLocalDate(date);
                if (pickerStep === 'start') {
                  setStartDate(date);
                  if (endDate && endDate < date) setEndDate(null);
                  setLocalDate(endDate && endDate >= date ? endDate : date);
                  setPickerStep('end');
                } else {
                  setEndDate(date);
                  setPickerStep(null);
                }
              } else {
                handleDateDismiss();
              }
            }}
          />
        ) : (
          <Modal visible transparent animationType="none" onRequestClose={handleDateDismiss}>
            <View style={pickerStyles.overlay}>
              <TouchableOpacity
                style={pickerStyles.scrim}
                activeOpacity={1}
                onPress={handleDateDismiss}
              />
              <View style={pickerStyles.sheet}>
                <AppText style={pickerStyles.stepLabel}>{dateStepLabel}</AppText>
                <DateTimePicker
                  key={pickerStep}
                  value={localDate}
                  mode="date"
                  display="spinner"
                  minimumDate={minimumDate}
                  onChange={(_, date) => {
                    if (date) setLocalDate(date);
                  }}
                />
                <View style={pickerStyles.actions}>
                  <TouchableOpacity onPress={handleDateDismiss} style={pickerStyles.cancelBtn}>
                    <AppText style={pickerStyles.cancelText}>Cancel</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDateConfirm} style={pickerStyles.confirmBtn}>
                    <AppText style={pickerStyles.confirmText}>
                      {pickerStep === 'start' ? 'Next' : 'Done'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F4F4F5',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    gap: 16,
    alignItems: 'stretch',
    overflow: 'visible',
  },
  fieldWrap: {
    paddingVertical: 8,
    zIndex: 1,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 14,
    color: '#18181B',
  },
  inputWrap: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#18181B',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  suggestionsContainer: {
    maxHeight: 160,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 6,
    marginTop: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  suggestionItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E4E4E7',
  },
  suggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#18181B',
  },
  dateTrigger: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateTriggerText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#18181B',
  },
  submitBtn: {
    height: 40,
    borderRadius: 999,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#44FFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: '#A1A1AA',
    borderColor: '#A1A1AA',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#FAFAFA',
  },
});

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    paddingTop: 16,
  },
  stepLabel: {
    fontSize: 14,
    color: '#71717A',
    textAlign: 'center',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  cancelText: { fontSize: 16, color: '#71717A' },
  confirmBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#18181B',
    borderRadius: 8,
  },
  confirmText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
