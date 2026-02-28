import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOnboarding } from './_layout';
import { AppLogo, AppInput, PrimaryButton, ProgressBar, ScreenTitle, ScreenSubtitle, AppText, useThemeColor } from '@shared/ui-kit';
import { Ionicons } from '@expo/vector-icons';
import DateIcon from '../../../assets/images/date_icon.svg';
import { Country, City } from 'country-state-city';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// ─── Location data ─────────────────────────────────────────────────────────────

const ALL_COUNTRIES = Country.getAllCountries();
const COUNTRY_MAP = new Map(ALL_COUNTRIES.map((c) => [c.isoCode, c]));
const ALL_CITIES = City.getAllCities();

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatBirthday(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = MONTHS_SHORT[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

function searchPlaces(query: string): string[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];

  const seen = new Set<string>();
  const results: string[] = [];

  for (const country of ALL_COUNTRIES) {
    if (country.name.toLowerCase().includes(q)) {
      const key = country.name;
      if (!seen.has(key)) { seen.add(key); results.push(key); }
      if (results.length >= 5) break;
    }
  }

  let cityCount = 0;
  for (const city of ALL_CITIES) {
    if (city.name.toLowerCase().includes(q)) {
      const country = COUNTRY_MAP.get(city.countryCode);
      const countryName = country?.name ?? '';
      const key = countryName ? `${city.name}, ${countryName}` : city.name;
      if (!seen.has(key)) {
        seen.add(key);
        results.push(key);
        cityCount++;
        if (cityCount >= 30) break;
      }
    }
  }

  return results;
}

const MAX_DATE = new Date(new Date().getFullYear() - 13, new Date().getMonth(), new Date().getDate());
const MIN_DATE = new Date(1924, 0, 1);
const DEFAULT_DATE = new Date(1995, 0, 1);

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PersonalScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [name, setName] = useState(data.name);
  const [surname, setSurname] = useState(data.surname);
  const [email, setEmail] = useState(data.email);
  const [showErrors, setShowErrors] = useState(false);

  // Birthday
  const [birthdayDate, setBirthdayDate] = useState<Date>(DEFAULT_DATE);
  const [birthday, setBirthday] = useState(data.birthday);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Location
  const [location, setLocation] = useState(data.location);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [placeSearch, setPlaceSearch] = useState('');

  const bgColor = useThemeColor('background');
  const borderColor = useThemeColor('border');
  const subText = useThemeColor('subText');
  const textColor = useThemeColor('text');

  const filteredPlaces = useMemo(() => searchPlaces(placeSearch), [placeSearch]);

  const handleNext = () => {
    if (!name.trim() || !surname.trim()) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    update({ name: name.trim(), surname: surname.trim(), email: email.trim(), birthday, location });
    router.push('/auth/onboarding/pace');
  };

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setBirthdayDate(selected);
  };

  const handleConfirmDate = () => {
    setBirthday(formatBirthday(birthdayDate));
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bgColor }]} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <ProgressBar step={1} total={5} />
          <View style={styles.logoRow}>
            <AppLogo size="md" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle text="Let's map your travel taste." />
          <ScreenSubtitle text="A few quick questions so we can build your unique travel profile." />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <AppInput
                label="Name"
                leftIcon="person-outline"
                value={name}
                onChangeText={(v) => { setName(v); setShowErrors(false); }}
                placeholder="John"
                returnKeyType="next"
                autoFocus
                hasError={showErrors && !name.trim()}
              />
            </View>
            <View style={styles.gap} />
            <View style={styles.halfInput}>
              <AppInput
                label="Surname"
                leftIcon="person-outline"
                value={surname}
                onChangeText={(v) => { setSurname(v); setShowErrors(false); }}
                placeholder="Doe"
                returnKeyType="next"
                hasError={showErrors && !surname.trim()}
              />
            </View>
          </View>

          <AppInput
            label="Email"
            optional
            leftIcon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="johndoe@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            style={styles.fieldSpacing}
          />

          {/* Birthday */}
          <View style={styles.fieldSpacing}>
            <AppText style={[styles.label, { color: textColor }]}>Birthday</AppText>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
              style={[styles.pickerRow, { borderColor, backgroundColor: bgColor }]}
            >
              <DateIcon width={12} height={13} style={styles.dateIcon} />
              <AppText style={[styles.pickerText, { color: birthday ? textColor : subText }]}>
                {birthday || 'Pick a date'}
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Where do you live */}
          <View style={styles.fieldSpacing}>
            <AppText style={[styles.label, { color: textColor }]}>Where do you live</AppText>
            <TouchableOpacity
              onPress={() => { setPlaceSearch(''); setShowLocationPicker(true); }}
              activeOpacity={0.7}
              style={[styles.pickerRow, { borderColor, backgroundColor: bgColor }]}
            >
              <AppText style={[styles.pickerText, { color: location ? textColor : subText, flex: 1 }]}>
                {location || 'Placeholder'}
              </AppText>
              <Ionicons name="chevron-down" size={14} color={subText} />
            </TouchableOpacity>
          </View>

          <View style={styles.spacer} />
          <PrimaryButton label="Next" onPress={handleNext} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Date Picker Modal (native spinner) ── */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity
          style={styles.dateScrim}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.datePickerCard} onPress={() => {}}>
            <AppText style={styles.cardTitle}>Birthday</AppText>
            <DateTimePicker
              value={birthdayDate}
              mode="date"
              display="spinner"
              onChange={onDateChange}
              maximumDate={MAX_DATE}
              minimumDate={MIN_DATE}
              textColor="#18181B"
              style={styles.nativePicker}
            />
            <View style={styles.pickerActions}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.pickerCancel}>
                <AppText style={styles.pickerCancelText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmDate} style={styles.pickerDone}>
                <AppText style={styles.pickerDoneText}>Done</AppText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Location Bottom Sheet ── */}
      <Modal
        visible={showLocationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <TouchableOpacity
          style={styles.locationScrim}
          activeOpacity={1}
          onPress={() => setShowLocationPicker(false)}
        />
        <View style={styles.locationSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetTitleRow}>
            <AppText style={styles.sheetTitle}>Where do you live?</AppText>
            <TouchableOpacity onPress={() => setShowLocationPicker(false)}>
              <AppText style={styles.sheetCancel}>Cancel</AppText>
            </TouchableOpacity>
          </View>

          <View style={[styles.searchWrap, { borderColor }]}>
            <Ionicons name="search-outline" size={14} color={subText} style={{ marginRight: 8 }} />
            <TextInput
              value={placeSearch}
              onChangeText={setPlaceSearch}
              placeholder="Search city or country..."
              placeholderTextColor={subText}
              style={[styles.searchInput, { color: textColor }]}
              autoFocus
            />
            {placeSearch.length > 0 && (
              <TouchableOpacity onPress={() => setPlaceSearch('')}>
                <Ionicons name="close-circle" size={16} color={subText} />
              </TouchableOpacity>
            )}
          </View>

          {placeSearch.length < 2 ? (
            <View style={styles.hintWrap}>
              <AppText style={[styles.hintText, { color: subText }]}>Type at least 2 characters…</AppText>
            </View>
          ) : (
            <FlatList
              data={filteredPlaces}
              keyExtractor={(item) => item}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.placeList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => { setLocation(item); setShowLocationPicker(false); }}
                  style={[styles.placeRow, location === item && styles.placeRowSelected]}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.placeName, { color: textColor }]}>{item}</AppText>
                  {location === item && <Ionicons name="checkmark" size={16} color="#44FFFF" />}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  logoRow: { marginTop: 12 },
  row: { flexDirection: 'row', marginBottom: 16 },
  halfInput: { flex: 1 },
  gap: { width: 12 },
  fieldSpacing: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    height: 36,
  },
  dateIcon: { marginRight: 10 },
  pickerText: { fontSize: 12 },
  spacer: { flex: 1, minHeight: 24 },

  // Date picker modal
  dateScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerCard: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#18181B', marginBottom: 8 },
  nativePicker: { width: '100%' },
  pickerActions: {
    flexDirection: 'row',
    marginTop: 8,
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
  },
  pickerCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
  },
  pickerCancelText: { fontSize: 14, color: '#71717A' },
  pickerDone: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#18181B',
    alignItems: 'center',
  },
  pickerDoneText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

  // Location bottom sheet
  locationScrim: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  locationSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '60%',
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
  hintWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hintText: { fontSize: 13 },
  placeList: { flex: 1 },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  placeRowSelected: { backgroundColor: '#F4F4F5' },
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
