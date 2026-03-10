import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Country, City } from 'country-state-city';
import {
  AppHeader,
  AppInput,
  AppText,
  PrimaryButton,
  WarningBanner,
  useThemeColor,
} from '@shared/ui-kit';
import { Profile } from '../../domain/entities/Profile';
import { ChangePhoneModal } from '../components/ChangePhoneModal';
import { PersonaSelect, PersonaMultiSelect } from '../components/PersonaSelect';
import {
  PACE_OPTIONS,
  INTEREST_OPTIONS,
  JOURNALING_OPTIONS,
  COMPANIONSHIP_OPTIONS,
} from '../constants/personaOptions';

// ─── Location helpers (same as onboarding) ──────────────────────────────────

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

function parseBirthdayToDate(str: string | null): Date | null {
  if (!str) return null;
  const parts = str.split(' ');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const monthIdx = MONTHS_SHORT.indexOf(parts[1]);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || monthIdx === -1 || isNaN(year)) return null;
  return new Date(year, monthIdx, day);
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

// ─── Component ───────────────────────────────────────────────────────────────

interface EditProfileScreenProps {
  profile: Profile;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
  onSave: (params: {
    name: string;
    surname: string;
    email: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    birthday: string | null;
    location: string | null;
    pace: string | null;
    interests: string[];
    journaling: string | null;
    companionship: string | null;
  }) => Promise<boolean>;
  onUploadAvatar: (fileUri: string) => Promise<string | null>;
  onBack: () => void;
  /** Called after phone number has been successfully changed */
  onPhoneChanged?: () => void;
}

export function EditProfileScreen({
  profile,
  isLoading,
  error,
  onClearError,
  onSave,
  onUploadAvatar,
  onBack,
  onPhoneChanged,
}: EditProfileScreenProps) {
  const [name, setName] = useState(profile.name ?? '');
  const [surname, setSurname] = useState(profile.surname ?? '');
  const [email, setEmail] = useState(profile.email ?? '');
  const [birthday, setBirthday] = useState<string | null>(profile.birthday ?? null);
  const [location, setLocation] = useState<string | null>(profile.location ?? null);
  const [pace, setPace] = useState<string | null>(profile.persona?.pace ?? null);
  const [interests, setInterests] = useState<string[]>(profile.persona?.interests ?? []);
  const [journaling, setJournaling] = useState<string | null>(profile.persona?.journaling ?? null);
  const [companionship, setCompanionship] = useState<string | null>(
    profile.persona?.companionship ?? null,
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl ?? null);
  const [avatarCacheKey, setAvatarCacheKey] = useState(
    () => (profile.updatedAt ? new Date(profile.updatedAt).getTime() : 0),
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Birthday picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthdayDate, setBirthdayDate] = useState<Date>(
    () => parseBirthdayToDate(profile.birthday) ?? DEFAULT_DATE,
  );

  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [placeSearch, setPlaceSearch] = useState('');

  // Phone change modal state
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const bg = useThemeColor('background');
  const text = useThemeColor('text');
  const border = useThemeColor('border');
  const subText = useThemeColor('subText');

  const filteredPlaces = useMemo(() => searchPlaces(placeSearch), [placeSearch]);

  useEffect(() => {
    setName(profile.name ?? '');
    setSurname(profile.surname ?? '');
    setEmail(profile.email ?? '');
    setBirthday(profile.birthday ?? null);
    setLocation(profile.location ?? null);
    setPace(profile.persona?.pace ?? null);
    setInterests(profile.persona?.interests ?? []);
    setJournaling(profile.persona?.journaling ?? null);
    setCompanionship(profile.persona?.companionship ?? null);
    setAvatarUrl(profile.avatarUrl ?? null);
    setAvatarCacheKey(profile.updatedAt ? new Date(profile.updatedAt).getTime() : 0);
    setBirthdayDate(parseBirthdayToDate(profile.birthday) ?? DEFAULT_DATE);
  }, [profile]);

  const canSave = name.trim().length > 0 && surname.trim().length > 0;

  const buildSaveParams = (overrides?: { avatar_url?: string | null }) => ({
    name: name.trim(),
    surname: surname.trim(),
    email: email.trim() || null,
    username: profile.username?.trim() || null,
    avatar_url: overrides?.avatar_url !== undefined ? overrides.avatar_url : avatarUrl,
    bio: profile.bio?.trim() || null,
    birthday,
    location,
    pace,
    interests,
    journaling,
    companionship,
  });

  const handleSave = async () => {
    const success = await onSave(buildSaveParams());
    if (success) onBack();
  };

  const pickAndUploadAvatar = async () => {
    const { launchImageLibraryAsync } = await import('expo-image-picker');
    const result = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    setIsUploadingAvatar(true);
    try {
      const url = await onUploadAvatar(result.assets[0].uri);
      if (url) {
        setAvatarUrl(url);
        setAvatarCacheKey(Date.now());
        await onSave(buildSaveParams({ avatar_url: url }));
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarUrl(null);
    await onSave(buildSaveParams({ avatar_url: null }));
  };

  const handleAvatarPress = () => {
    const buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' }[] = [
      { text: 'Change Photo', onPress: pickAndUploadAvatar },
    ];
    if (avatarUrl) {
      buttons.push({ text: 'Remove Photo', onPress: removeAvatar, style: 'destructive' });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Profile Photo', undefined, buttons);
  };

  const onDateChange = (_: DateTimePickerEvent, selected?: Date) => {
    if (selected) setBirthdayDate(selected);
  };

  const handleConfirmDate = () => {
    setBirthday(formatBirthday(birthdayDate));
    setShowDatePicker(false);
  };

  const initials =
    (name[0] ?? '').toUpperCase() + (surname[0] ?? '').toUpperCase() || '?';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={['bottom']}>
      <AppHeader
        variant="dark"
        showAdminLabel={profile.role === 'admin'}
      />

      {error && (
        <View style={styles.errorBannerWrap}>
          <WarningBanner message={error} onDismiss={onClearError} />
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={[styles.avatarWrap, { backgroundColor: text }]}>
              {avatarUrl ? (
                <Image
                  source={{
                    uri: avatarUrl + (avatarCacheKey ? `?v=${avatarCacheKey}` : ''),
                  }}
                  style={styles.avatarImg}
                />
              ) : (
                <AppText style={[styles.avatarText, { color: bg }]}>{initials}</AppText>
              )}
              <TouchableOpacity
                style={[styles.cameraBtn, { backgroundColor: bg, borderColor: border }]}
                onPress={handleAvatarPress}
                disabled={isUploadingAvatar}
                activeOpacity={0.8}
              >
                {isUploadingAvatar ? (
                  <AppText style={[styles.avatarText, { color: text, fontSize: 12 }]}>...</AppText>
                ) : (
                  <Ionicons name="camera-outline" size={16} color={text} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Name, Surname, Email */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <AppInput
                  label="Name"
                  leftIcon="person-outline"
                  value={name}
                  onChangeText={setName}
                  placeholder={name ? undefined : '-'}
                  maxLength={50}
                />
              </View>
              <View style={styles.gap} />
              <View style={styles.halfInput}>
                <AppInput
                  label="Surname"
                  leftIcon="person-outline"
                  value={surname}
                  onChangeText={setSurname}
                  placeholder={surname ? undefined : '-'}
                  maxLength={50}
                />
              </View>
            </View>
            <AppInput
              label="Email"
              leftIcon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder={email ? undefined : '-'}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Phone Number */}
            <View style={styles.fieldSpacing}>
              <AppText style={[styles.fieldLabel, { color: text }]}>Phone Number</AppText>
              <View style={[styles.phoneFieldRow]}>
                <View style={[styles.pickerRow, { borderColor: border, backgroundColor: bg, flex: 1 }]}>
                  <Ionicons name="call-outline" size={14} color={subText} style={styles.pickerIcon} />
                  <AppText style={[styles.pickerText, { color: profile.phone ? text : subText }]}>
                    {profile.phone || 'No phone number'}
                  </AppText>
                </View>
                <TouchableOpacity
                  onPress={() => setShowPhoneModal(true)}
                  activeOpacity={0.7}
                  style={styles.changePhoneBtn}
                >
                  <AppText style={styles.changePhoneBtnText}>Change</AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* Birthday */}
            <View style={styles.fieldSpacing}>
              <AppText style={[styles.fieldLabel, { color: text }]}>Birthday</AppText>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
                style={[styles.pickerRow, { borderColor: border, backgroundColor: bg }]}
              >
                <Ionicons name="calendar-outline" size={14} color={subText} style={styles.pickerIcon} />
                <AppText style={[styles.pickerText, { color: birthday ? text : subText }]}>
                  {birthday || 'Pick a date'}
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Location */}
            <View style={styles.fieldSpacing}>
              <AppText style={[styles.fieldLabel, { color: text }]}>Where do you live</AppText>
              <TouchableOpacity
                onPress={() => { setPlaceSearch(''); setShowLocationPicker(true); }}
                activeOpacity={0.7}
                style={[styles.pickerRow, { borderColor: border, backgroundColor: bg }]}
              >
                <AppText style={[styles.pickerText, { color: location ? text : subText, flex: 1 }]}>
                  {location || 'Select location'}
                </AppText>
                <Ionicons name="chevron-down" size={14} color={subText} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Travel persona */}
          <View style={styles.personaSection}>
            <AppText style={[styles.personaTitle, { color: text }]}>Travel persona</AppText>
            <PersonaSelect
              label="Pace"
              value={pace}
              options={PACE_OPTIONS}
              onSelect={setPace}
              placeholder="Select pace"
            />
            <PersonaMultiSelect
              label="Travel Interests"
              value={interests}
              options={INTEREST_OPTIONS}
              onSelect={setInterests}
              placeholder="Select interests"
            />
            <PersonaSelect
              label="Journaling pref."
              value={journaling}
              options={JOURNALING_OPTIONS}
              onSelect={setJournaling}
              placeholder="Select journaling"
            />
            <PersonaSelect
              label="Usual companionship"
              value={companionship}
              options={COMPANIONSHIP_OPTIONS}
              onSelect={setCompanionship}
              placeholder="Select companionship"
            />
          </View>

          {/* Cancel, Save */}
          <View style={styles.actions}>
            <PrimaryButton
              label="Cancel"
              variant="outline"
              onPress={onBack}
              style={[styles.cancelBtn, { borderColor: '#E4E4E7' }]}
            />
            <PrimaryButton
              label="Save"
              onPress={handleSave}
              isLoading={isLoading}
              disabled={!canSave}
              preserveStyle
              style={styles.saveBtn}
              labelStyle={styles.saveText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Date Picker Modal ── */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="none"
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
            <View style={styles.datePickerActions}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.datePickerCancel}>
                <AppText style={styles.datePickerCancelText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmDate} style={styles.datePickerDone}>
                <AppText style={styles.datePickerDoneText}>Done</AppText>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Location Bottom Sheet ── */}
      <Modal
        visible={showLocationPicker}
        transparent
        animationType="none"
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

          <View style={[styles.searchWrap, { borderColor: border }]}>
            <Ionicons name="search-outline" size={14} color={subText} style={{ marginRight: 8 }} />
            <TextInput
              value={placeSearch}
              onChangeText={setPlaceSearch}
              placeholder="Search city or country..."
              placeholderTextColor={subText}
              style={[styles.searchInput, { color: text }]}
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
                  <AppText style={[styles.placeName, { color: text }]}>{item}</AppText>
                  {location === item && <Ionicons name="checkmark" size={16} color="#44FFFF" />}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>

      {/* ── Change Phone Modal ── */}
      <ChangePhoneModal
        visible={showPhoneModal}
        currentPhone={profile.phone}
        onClose={() => setShowPhoneModal(false)}
        onSuccess={() => {
          setShowPhoneModal(false);
          onPhoneChanged?.();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  errorBannerWrap: { paddingHorizontal: 24, marginBottom: 8 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingTop: 16, paddingBottom: 24 },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImg: { width: 96, height: 96, borderRadius: 48 },
  avatarText: { fontSize: 32, fontWeight: '700' },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: { marginBottom: 24 },
  row: { flexDirection: 'row', marginBottom: 24 },
  halfInput: { flex: 1 },
  gap: { width: 12 },
  fieldSpacing: { marginTop: 16 },
  fieldLabel: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 14,
    height: 36,
  },
  pickerIcon: { marginRight: 10 },
  pickerText: { fontSize: 12 },
  phoneFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  changePhoneBtn: {
    backgroundColor: '#18181B',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  changePhoneBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  personaSection: {
    marginBottom: 24,
  },
  personaTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    width: 92,
  },
  saveBtn: { flex: 1, height: 40, paddingVertical: 0, paddingHorizontal: 0, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FAFAFA', fontSize: 14, fontWeight: '500' },

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
  datePickerActions: {
    flexDirection: 'row',
    marginTop: 8,
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
  },
  datePickerCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
  },
  datePickerCancelText: { fontSize: 14, color: '#71717A' },
  datePickerDone: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#18181B',
    alignItems: 'center',
  },
  datePickerDoneText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },

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
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 16,
    marginBottom: 12,
  },
  sheetTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#18181B' },
  sheetCancel: { fontSize: 14, color: '#71717A' },
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
});
