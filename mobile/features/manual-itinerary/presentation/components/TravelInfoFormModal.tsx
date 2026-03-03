import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { AppText, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';
import airports from 'airports';
import { Country, City } from 'country-state-city';
import type { TravelInfo, TravelInfoType } from '../../domain/entities/TravelInfo';
import type {
  AddTravelInfoParams,
  UpdateTravelInfoParams,
} from '../../domain/repository/ManualItineraryRepository';

const TYPE_OPTIONS: { label: string; value: TravelInfoType; icon: 'airplane-outline' | 'bed-outline' | 'car-outline' | 'document-text-outline' }[] = [
  { label: 'Flight', value: 'flight', icon: 'airplane-outline' },
  // { label: 'Hotel', value: 'hotel', icon: 'bed-outline' },
  { label: 'Rental Car', value: 'rental_car', icon: 'car-outline' },
  { label: 'Other', value: 'other', icon: 'document-text-outline' },
];

function normalizeForSearch(input: string): string {
  if (!input) return '';
  return input
    .toString()
    .toLocaleLowerCase('tr-TR')
    // Remove diacritics (e.g. ğ → g, ı → i, ö → o, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export interface TravelInfoFormModalProps {
  visible: boolean;
  editingItem: TravelInfo | null;
  onAdd: (params: AddTravelInfoParams) => Promise<unknown>;
  onUpdate: (id: string, params: UpdateTravelInfoParams) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
  onClose: () => void;
}

export function TravelInfoFormModal({
  visible,
  editingItem,
  onAdd,
  onUpdate,
  onRemove,
  onClose,
}: TravelInfoFormModalProps) {
  const textColor = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const accent = useThemeColor('accent');

  const [type, setType] = useState<TravelInfoType>('flight');
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const [startDatetime, setStartDatetime] = useState<string | null>(null);
  const [endDatetime, setEndDatetime] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localDate, setLocalDate] = useState<Date>(new Date());
  const [departureLocation, setDepartureLocation] = useState('');
  const [showAirportPicker, setShowAirportPicker] = useState(false);
  const [airportSearch, setAirportSearch] = useState('');
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [localEndDate, setLocalEndDate] = useState<Date>(new Date());
  const [otherLocation, setOtherLocation] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const sheetTranslateY = useRef(new Animated.Value(600)).current;
  const airportSheetTranslateY = useRef(new Animated.Value(600)).current;
  const citySheetTranslateY = useRef(new Animated.Value(600)).current;
  const datePickerOpacity = useRef(new Animated.Value(0)).current;
  const endDatePickerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(sheetTranslateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      sheetTranslateY.setValue(600);
    }
  }, [visible]);

  useEffect(() => {
    if (showAirportPicker) {
      Animated.spring(airportSheetTranslateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      airportSheetTranslateY.setValue(600);
    }
  }, [showAirportPicker]);

  useEffect(() => {
    if (showCityPicker) {
      Animated.spring(citySheetTranslateY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      citySheetTranslateY.setValue(600);
    }
  }, [showCityPicker]);

  useEffect(() => {
    if (showDatePicker) {
      Animated.timing(datePickerOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    } else {
      datePickerOpacity.setValue(0);
    }
  }, [showDatePicker]);

  useEffect(() => {
    if (showEndDatePicker) {
      Animated.timing(endDatePickerOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    } else {
      endDatePickerOpacity.setValue(0);
    }
  }, [showEndDatePicker]);

  const allCountries = useMemo(() => Country.getAllCountries(), []);
  const countryMap = useMemo(() => new Map(allCountries.map((c) => [c.isoCode, c])), [allCountries]);
  const allCities = useMemo(() => City.getAllCities(), []);

  const filteredAirports = useMemo(() => {
    const q = normalizeForSearch(airportSearch.trim());
    if (q.length < 2) return [];
    return (airports as any[])
      .filter((a) => {
        const rawName = String(a?.name ?? '');
        const rawCity = String(a?.city ?? '');
        const rawCountry = String(a?.country ?? '');
        const name = normalizeForSearch(rawName);
        const city = normalizeForSearch(rawCity);
        const countryLower = normalizeForSearch(rawCountry);
        const countryFromMap = countryMap.get(rawCountry);
        const countryFullNameLower = countryFromMap?.name
          ? normalizeForSearch(countryFromMap.name)
          : '';
        const iata = normalizeForSearch(String(a?.iata ?? ''));
        return (
          name.includes(q) ||
          city.includes(q) ||
          countryLower.includes(q) ||
          (countryFullNameLower && countryFullNameLower.includes(q)) ||
          (iata && iata.startsWith(q))
        );
      })
      .slice(0, 30)
      .map((a) => {
        const rawName = a?.name ?? '';
        const rawCity = a?.city ?? '';
        const rawCountryCodeOrName = a?.country ?? '';
        const countryFromMapDisplay = countryMap.get(rawCountryCodeOrName);
        const displayCountry =
          countryFromMapDisplay?.name ?? String(rawCountryCodeOrName || '');
        const iata = a?.iata ? ` (${a.iata})` : '';

        const safeName = String(rawName || rawCity || displayCountry || 'Unknown airport');
        const locationParts: string[] = [];
        if (rawCity) locationParts.push(String(rawCity));
        if (displayCountry) locationParts.push(displayCountry);
        const location = locationParts.join(', ');

        return location ? `${safeName}${iata} — ${location}` : `${safeName}${iata}`;
      });
  }, [airportSearch, countryMap]);

  const filteredCities = useMemo(() => {
    const q = normalizeForSearch(citySearch.trim());
    if (q.length < 2) return [];

    const seen = new Set<string>();
    const results: string[] = [];

    for (const city of allCities) {
      const cityName = city.name ?? '';
      const cityNorm = normalizeForSearch(cityName);
      if (cityNorm.includes(q)) {
        const country = countryMap.get(city.countryCode);
        const countryName = country?.name ?? '';
        const key = countryName ? `${cityName}, ${countryName}` : cityName;
        if (!seen.has(key)) {
          seen.add(key);
          results.push(key);
          if (results.length >= 50) break;
        }
      }
    }

    return results;
  }, [citySearch, allCities, countryMap]);

  useEffect(() => {
    if (!visible) return;
    if (editingItem) {
      setType(editingItem.type);
      setTitle(editingItem.title);
      setProvider(editingItem.provider ?? '');
      setDetail(editingItem.detail ?? '');
      setStartDatetime(editingItem.startDatetime ?? null);
      setEndDatetime(editingItem.endDatetime ?? null);
      if (editingItem.startDatetime) {
        const parsed = new Date(editingItem.startDatetime);
        if (!Number.isNaN(parsed.getTime())) {
          setLocalDate(parsed);
        } else {
          setLocalDate(new Date());
        }
      } else {
        setLocalDate(new Date());
      }
      if (editingItem.endDatetime) {
        const parsedEnd = new Date(editingItem.endDatetime);
        if (!Number.isNaN(parsedEnd.getTime())) {
          setLocalEndDate(parsedEnd);
        } else {
          setLocalEndDate(new Date());
        }
      } else {
        setLocalEndDate(new Date());
      }
    } else {
      setType('flight');
      setTitle('');
      setProvider('');
      setDetail('');
      setStartDatetime(null);
      setLocalDate(new Date());
      setDepartureLocation('');
      setOtherLocation('');
      setEndDatetime(null);
      setLocalEndDate(new Date());
    }
    setBusy(false);
  }, [visible, editingItem]);

  const handleSave = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const params = {
        type,
        title: title.trim(),
        provider:
          type === 'flight'
            ? (departureLocation.trim() || provider.trim() || null)
            : type === 'other'
            ? (otherLocation.trim() || provider.trim() || null)
            : provider.trim() || null,
        detail: detail.trim() || null,
        startDatetime: startDatetime ? startDatetime.trim() || null : null,
        endDatetime: endDatetime ? endDatetime.trim() || null : null,
      };
      if (editingItem) {
        await onUpdate(editingItem.id, params);
      } else {
        await onAdd(params);
      }
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleSaveAndAddAnother = async () => {
    if (editingItem || !title.trim() || busy) return;
    setBusy(true);
    try {
      const params = {
        type,
        title: title.trim(),
        provider:
          type === 'flight'
            ? (departureLocation.trim() || provider.trim() || null)
            : type === 'other'
            ? (otherLocation.trim() || provider.trim() || null)
            : provider.trim() || null,
        detail: detail.trim() || null,
        startDatetime: startDatetime ? startDatetime.trim() || null : null,
        endDatetime: endDatetime ? endDatetime.trim() || null : null,
      };
      await onAdd(params);
      // Yeni kayıt ekle, modalı açık tut ve alanları temizle (type sabit kalsın)
      setTitle('');
      setProvider('');
      setDetail('');
      setStartDatetime(null);
      setLocalDate(new Date());
      setDepartureLocation('');
      setOtherLocation('');
      setEndDatetime(null);
      setLocalEndDate(new Date());
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    if (!editingItem || busy) return;
    setBusy(true);
    try {
      await onRemove(editingItem.id);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const canSave = title.trim().length > 0 && !busy;

  const effectiveDateValue = startDatetime ?? editingItem?.startDatetime ?? null;
  const formattedDateLabel = formatDateTimeLabel(effectiveDateValue);
  const effectiveEndDateValue = endDatetime ?? editingItem?.endDatetime ?? null;
  const formattedEndDateLabel = formatDateTimeLabel(effectiveEndDateValue);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.scrimTouchable} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { backgroundColor: surface, transform: [{ translateY: sheetTranslateY }] }]}>
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: border }]} />

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: border }]}>
            <AppText style={[styles.headerTitle, { color: textColor }]}>
              {editingItem ? 'Edit Travel Info' : 'Add Travel Info'}
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Type chips */}
            <View style={styles.typeRow}>
              {TYPE_OPTIONS.map((t) => {
                const isSelected = type === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={[
                      styles.typeChip,
                      { borderColor: border },
                      isSelected && { backgroundColor: accent, borderColor: accent },
                    ]}
                  >
                    <Ionicons
                      name={t.icon}
                      size={14}
                      color={isSelected ? '#fff' : secondary}
                    />
                    <AppText
                      style={[styles.typeLabel, { color: isSelected ? '#fff' : secondary }]}
                    >
                      {t.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Fields */}
            <FieldInput
              label="Title *"
              value={title}
              onChangeText={setTitle}
              placeholder={
                type === 'flight'
                  ? 'e.g. Istanbul → London'
                  : type === 'hotel'
                  ? 'e.g. Hotel Name'
                  : type === 'rental_car'
                  ? 'e.g. Car pickup'
                  : 'e.g. Train ticket'
              }
              textColor={textColor}
              secondary={secondary}
              border={border}
            />
            {type === 'flight' && (
              <View style={fieldStyles.wrap}>
                <AppText style={[fieldStyles.label, { color: secondary }]}>Departure location</AppText>
                <TouchableOpacity
                  onPress={() => {
                    setAirportSearch('');
                    setShowAirportPicker(true);
                  }}
                  activeOpacity={0.7}
                  style={[fieldStyles.input, { flexDirection: 'row', alignItems: 'center', borderColor: border }]}
                >
                  <Ionicons name="airplane-outline" size={16} color={secondary} style={{ marginRight: spacing.xs }} />
                  <AppText
                    style={{ flex: 1, ...typography.sm, color: departureLocation ? textColor : secondary }}
                    numberOfLines={1}
                  >
                    {departureLocation || 'Select departure airport'}
                  </AppText>
                </TouchableOpacity>
                <TextInput
                  style={[
                    fieldStyles.input,
                    {
                      marginTop: spacing.xs,
                      color: textColor,
                      borderColor: border,
                    },
                  ]}
                  value={departureLocation}
                  onChangeText={setDepartureLocation}
                  placeholder="Or type departure location manually"
                  placeholderTextColor={secondary}
                />
              </View>
            )}
            {type === 'other' && (
              <View style={fieldStyles.wrap}>
                <AppText style={[fieldStyles.label, { color: secondary }]}>Location</AppText>
                <TouchableOpacity
                  onPress={() => {
                    setCitySearch('');
                    setShowCityPicker(true);
                  }}
                  activeOpacity={0.7}
                  style={[fieldStyles.input, { flexDirection: 'row', alignItems: 'center', borderColor: border }]}
                >
                  <Ionicons name="location-outline" size={16} color={secondary} style={{ marginRight: spacing.xs }} />
                  <AppText
                    style={{ flex: 1, ...typography.sm, color: otherLocation ? textColor : secondary }}
                    numberOfLines={1}
                  >
                    {otherLocation || 'Select city'}
                  </AppText>
                </TouchableOpacity>
                <TextInput
                  style={[
                    fieldStyles.input,
                    {
                      marginTop: spacing.xs,
                      color: textColor,
                      borderColor: border,
                    },
                  ]}
                  value={otherLocation}
                  onChangeText={setOtherLocation}
                  placeholder="Or type location manually"
                  placeholderTextColor={secondary}
                />
              </View>
            )}
            <FieldInput
              label={type === 'flight' ? 'Airline / Provider' : 'Provider'}
              value={provider}
              onChangeText={setProvider}
              placeholder={
                type === 'flight'
                  ? 'e.g. Turkish Airlines'
                  : type === 'hotel'
                  ? 'e.g. Marriott'
                  : type === 'rental_car'
                  ? 'e.g. Hertz'
                  : 'e.g. Eurostar'
              }
              textColor={textColor}
              secondary={secondary}
              border={border}
            />
            <FieldInput
              label="Reference / Detail"
              value={detail}
              onChangeText={setDetail}
              placeholder={
                type === 'flight'
                  ? 'e.g. Outbound / Return / Gate 12'
                  : type === 'hotel'
                  ? 'e.g. Check-in / Check-out'
                  : type === 'rental_car'
                  ? 'e.g. Pickup / Drop Off'
                  : 'e.g. Booking ref: ABC123'
              }
              textColor={textColor}
              secondary={secondary}
              border={border}
            />
            <View style={fieldStyles.wrap}>
              <AppText style={[fieldStyles.label, { color: secondary }]}>
                {getDateFieldLabel(type, detail)}
              </AppText>
              <View style={fieldStyles.dateRow}>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  activeOpacity={0.7}
                  style={[fieldStyles.dateButton, { borderColor: border }]}
                >
                  <Ionicons name="calendar-outline" size={16} color={secondary} />
                  <AppText
                    style={[
                      fieldStyles.dateButtonLabel,
                      { color: formattedDateLabel ? textColor : secondary },
                    ]}
                    numberOfLines={1}
                  >
                    {formattedDateLabel || getDatePlaceholder(type, detail)}
                  </AppText>
                </TouchableOpacity>
                {effectiveDateValue && (
                  <TouchableOpacity
                    onPress={() => setStartDatetime(null)}
                    hitSlop={8}
                    style={fieldStyles.clearDateButton}
                  >
                    <Ionicons name="close-circle" size={16} color={secondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {(type === 'hotel' || type === 'rental_car') && (
              <View style={fieldStyles.wrap}>
                <AppText style={[fieldStyles.label, { color: secondary }]}>
                  {type === 'hotel'
                    ? 'Check-out date & time (optional)'
                    : 'Drop-off date & time (optional)'}
                </AppText>
                <View style={fieldStyles.dateRow}>
                  <TouchableOpacity
                    onPress={() => setShowEndDatePicker(true)}
                    activeOpacity={0.7}
                    style={[fieldStyles.dateButton, { borderColor: border }]}
                  >
                    <Ionicons name="calendar-outline" size={16} color={secondary} />
                    <AppText
                      style={[
                        fieldStyles.dateButtonLabel,
                        { color: formattedEndDateLabel ? textColor : secondary },
                      ]}
                      numberOfLines={1}
                    >
                      {formattedEndDateLabel ||
                        (type === 'hotel'
                          ? 'Pick check-out date & time'
                          : 'Pick drop-off date & time')}
                    </AppText>
                  </TouchableOpacity>
                  {effectiveEndDateValue && (
                    <TouchableOpacity
                      onPress={() => setEndDatetime(null)}
                      hitSlop={8}
                      style={fieldStyles.clearDateButton}
                    >
                      <Ionicons name="close-circle" size={16} color={secondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
              {editingItem && (
                <TouchableOpacity
                  onPress={handleRemove}
                  disabled={busy}
                  style={[styles.deleteBtn, { borderColor: '#EF4444' }]}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
              {!editingItem && (
                <TouchableOpacity
                  onPress={handleSaveAndAddAnother}
                  disabled={!canSave}
                  style={[
                    styles.addAnotherBtn,
                    { borderColor: accent },
                    !canSave && styles.saveBtnDisabled,
                  ]}
                >
                  <AppText style={[styles.addAnotherLabel, { color: accent }]}>
                    Add another
                  </AppText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                disabled={!canSave}
                style={[
                  styles.saveBtn,
                  { backgroundColor: accent },
                  !canSave && styles.saveBtnDisabled,
                ]}
              >
                <AppText style={styles.saveBtnLabel}>
                  {editingItem ? 'Update' : 'Add'}
                </AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Date-time picker (iOS modal style for both platforms to match app) */}
          <Modal
            visible={showDatePicker}
            transparent
            animationType="none"
            onRequestClose={() => setShowDatePicker(false)}
          >
            <TouchableOpacity
              style={styles.dateOverlay}
              activeOpacity={1}
              onPress={() => setShowDatePicker(false)}
            >
              <Animated.View style={{ opacity: datePickerOpacity }}>
              <TouchableOpacity activeOpacity={1} style={[styles.dateCard, { backgroundColor: surface }]}>
                <AppText style={[styles.dateTitle, { color: textColor }]}>
                  {getDatePickerTitle(type, detail)}
                </AppText>
                <DateTimePicker
                  value={localDate}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, d) => {
                    if (d) setLocalDate(d);
                  }}
                />
                <View style={styles.dateActions}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.dateCancel}
                  >
                    <AppText style={[styles.dateCancelLabel, { color: secondary }]}>Cancel</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setStartDatetime(localDate.toISOString());
                      setShowDatePicker(false);
                    }}
                    style={[styles.dateConfirm, { backgroundColor: accent }]}
                  >
                    <AppText style={styles.dateConfirmLabel}>Done</AppText>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>
          </Modal>

          {/* Secondary date-time picker for hotel / rental car end date */}
          <Modal
            visible={showEndDatePicker}
            transparent
            animationType="none"
            onRequestClose={() => setShowEndDatePicker(false)}
          >
            <TouchableOpacity
              style={styles.dateOverlay}
              activeOpacity={1}
              onPress={() => setShowEndDatePicker(false)}
            >
              <Animated.View style={{ opacity: endDatePickerOpacity }}>
              <TouchableOpacity activeOpacity={1} style={[styles.dateCard, { backgroundColor: surface }]}>
                <AppText style={[styles.dateTitle, { color: textColor }]}>
                  {type === 'hotel'
                    ? 'Select check-out date & time'
                    : 'Select drop-off date & time'}
                </AppText>
                <DateTimePicker
                  value={localEndDate}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(_, d) => {
                    if (d) setLocalEndDate(d);
                  }}
                />
                <View style={styles.dateActions}>
                  <TouchableOpacity
                    onPress={() => setShowEndDatePicker(false)}
                    style={styles.dateCancel}
                  >
                    <AppText style={[styles.dateCancelLabel, { color: secondary }]}>Cancel</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setEndDatetime(localEndDate.toISOString());
                      setShowEndDatePicker(false);
                    }}
                    style={[styles.dateConfirm, { backgroundColor: accent }]}
                  >
                    <AppText style={styles.dateConfirmLabel}>Done</AppText>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>
          </Modal>

          {/* Airport picker modal */}
          <Modal
            visible={showAirportPicker}
            transparent
            animationType="none"
            onRequestClose={() => setShowAirportPicker(false)}
          >
            <TouchableOpacity
              style={styles.locationScrim}
              activeOpacity={1}
              onPress={() => setShowAirportPicker(false)}
            />
            <Animated.View style={[styles.locationSheet, { transform: [{ translateY: airportSheetTranslateY }] }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <AppText style={styles.sheetTitle}>Select departure airport</AppText>
                <TouchableOpacity onPress={() => setShowAirportPicker(false)}>
                  <AppText style={styles.sheetCancel}>Cancel</AppText>
                </TouchableOpacity>
              </View>
              <View style={[styles.searchWrap, { borderColor: border }]}>
                <Ionicons
                  name="search-outline"
                  size={14}
                  color={secondary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  value={airportSearch}
                  onChangeText={setAirportSearch}
                  placeholder="Search airport, city, or IATA..."
                  placeholderTextColor={secondary}
                  style={[styles.searchInput, { color: textColor }]}
                  autoFocus
                />
                {airportSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setAirportSearch('')}>
                    <Ionicons name="close-circle" size={16} color={secondary} />
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView keyboardShouldPersistTaps="handled">
                {airportSearch.length < 2 ? (
                  <View style={styles.hintWrap}>
                    <AppText style={[styles.hintText, { color: secondary }]}>
                      Type at least 2 characters…
                    </AppText>
                  </View>
                ) : filteredAirports.length === 0 ? (
                  <View style={styles.hintWrap}>
                    <AppText style={[styles.hintText, { color: secondary }]}>
                      No airports found
                    </AppText>
                  </View>
                ) : (
                  filteredAirports.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setDepartureLocation(item);
                        setShowAirportPicker(false);
                      }}
                      style={styles.placeRow}
                      activeOpacity={0.7}
                    >
                      <AppText style={[styles.placeName, { color: textColor }]}>
                        {item}
                      </AppText>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </Animated.View>
          </Modal>

          {/* City picker modal for "Other" */}
          <Modal
            visible={showCityPicker}
            transparent
            animationType="none"
            onRequestClose={() => setShowCityPicker(false)}
          >
            <TouchableOpacity
              style={styles.locationScrim}
              activeOpacity={1}
              onPress={() => setShowCityPicker(false)}
            />
            <Animated.View style={[styles.locationSheet, { transform: [{ translateY: citySheetTranslateY }] }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetTitleRow}>
                <AppText style={styles.sheetTitle}>Select location</AppText>
                <TouchableOpacity onPress={() => setShowCityPicker(false)}>
                  <AppText style={styles.sheetCancel}>Cancel</AppText>
                </TouchableOpacity>
              </View>
              <View style={[styles.searchWrap, { borderColor: border }]}>
                <Ionicons
                  name="search-outline"
                  size={14}
                  color={secondary}
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  value={citySearch}
                  onChangeText={setCitySearch}
                  placeholder="Search city..."
                  placeholderTextColor={secondary}
                  style={[styles.searchInput, { color: textColor }]}
                  autoFocus
                />
                {citySearch.length > 0 && (
                  <TouchableOpacity onPress={() => setCitySearch('')}>
                    <Ionicons name="close-circle" size={16} color={secondary} />
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView keyboardShouldPersistTaps="handled">
                {citySearch.length < 2 ? (
                  <View style={styles.hintWrap}>
                    <AppText style={[styles.hintText, { color: secondary }]}>
                      Type at least 2 characters…
                    </AppText>
                  </View>
                ) : filteredCities.length === 0 ? (
                  <View style={styles.hintWrap}>
                    <AppText style={[styles.hintText, { color: secondary }]}>
                      No locations found
                    </AppText>
                  </View>
                ) : (
                  filteredCities.map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setOtherLocation(item);
                        setShowCityPicker(false);
                      }}
                      style={styles.placeRow}
                      activeOpacity={0.7}
                    >
                      <AppText style={[styles.placeName, { color: textColor }]}>{item}</AppText>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </Animated.View>
          </Modal>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function formatDateTimeLabel(value: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const hh = String(hours).padStart(2, '0');

  return `${day}.${month}.${year} - ${hh}:${minutes} ${ampm}`;
}

function getDateFieldLabel(type: TravelInfoType, detail: string): string {
  switch (type) {
    case 'flight':
      if (detail === 'Return') return 'Return date & time (optional)';
      return 'Departure date & time (optional)';
    case 'hotel':
      if (detail === 'Check-out') return 'Check-out date & time (optional)';
      return 'Check-in date & time (optional)';
    case 'rental_car':
      if (detail === 'Drop Off') return 'Drop-off date & time (optional)';
      return 'Pickup date & time (optional)';
    default:
      return 'Date & time (optional)';
  }
}

function getDatePlaceholder(type: TravelInfoType, detail: string): string {
  switch (type) {
    case 'flight':
      if (detail === 'Return') return 'Pick return date & time';
      return 'Pick departure date & time';
    case 'hotel':
      if (detail === 'Check-out') return 'Pick check-out date & time';
      return 'Pick check-in date & time';
    case 'rental_car':
      if (detail === 'Drop Off') return 'Pick drop-off date & time';
      return 'Pick pickup date & time';
    default:
      return 'Pick date & time';
  }
}

function getDatePickerTitle(type: TravelInfoType, detail: string): string {
  switch (type) {
    case 'flight':
      if (detail === 'Return') return 'Select return date & time';
      return 'Select departure date & time';
    case 'hotel':
      if (detail === 'Check-out') return 'Select check-out date & time';
      return 'Select check-in date & time';
    case 'rental_car':
      if (detail === 'Drop Off') return 'Select drop-off date & time';
      return 'Select pickup date & time';
    default:
      return 'Select date & time';
  }
}

// ─── Internal field component ─────────────────────────────────────────────────

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  textColor,
  secondary,
  border,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  textColor: string;
  secondary: string;
  border: string;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <AppText style={[fieldStyles.label, { color: secondary }]}>{label}</AppText>
      <TextInput
        style={[fieldStyles.input, { color: textColor, borderColor: border }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={secondary}
        returnKeyType="next"
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.md },
  label: { ...typography.caption, marginBottom: spacing.xs },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    ...typography.sm,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dateButtonLabel: {
    flex: 1,
    ...typography.sm,
  },
  clearDateButton: {
    padding: spacing.xs,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  scrimTouchable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    padding: spacing.xl,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    marginBottom: spacing.lg,
  },
  headerTitle: { ...typography.base, fontWeight: typography.weights.semibold },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  typeLabel: { ...typography.caption },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  deleteBtn: {
    width: 46,
    height: 46,
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAnotherBtn: {
    height: 46,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    height: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnLabel: {
    ...typography.base,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  addAnotherLabel: {
    ...typography.base,
    fontWeight: typography.weights.semibold,
  },
  dateOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateCard: {
    width: 320,
    borderRadius: radii.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  dateTitle: {
    ...typography.base,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  dateActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dateCancel: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  dateCancelLabel: {
    ...typography.sm,
  },
  dateConfirm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
  },
  dateConfirmLabel: {
    ...typography.sm,
    fontWeight: typography.weights.semibold,
    color: '#fff',
  },
  // Shared location picker styles (reused from onboarding screen pattern)
  locationScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  locationSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E4E7',
    alignSelf: 'center',
    marginBottom: 16,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },
  hintWrap: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  hintText: { fontSize: 13 },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  placeName: { flex: 1, fontSize: 14 },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 16,
    marginBottom: 12,
  },
  sheetTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#18181B' },
  sheetCancel: { fontSize: 14, color: '#71717A' },
});
