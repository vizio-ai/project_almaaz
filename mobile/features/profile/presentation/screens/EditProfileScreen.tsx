import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  AppHeader,
  AppInput,
  AppText,
  PrimaryButton,
  WarningBanner,
  useThemeColor,
} from '@shared/ui-kit';
import { Profile } from '../../domain/entities/Profile';
import { PersonaSelect, PersonaMultiSelect } from '../components/PersonaSelect';
import {
  PACE_OPTIONS,
  INTEREST_OPTIONS,
  JOURNALING_OPTIONS,
  COMPANIONSHIP_OPTIONS,
} from '../constants/personaOptions';

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
    pace: string | null;
    interests: string[];
    journaling: string | null;
    companionship: string | null;
  }) => Promise<boolean>;
  onUploadAvatar: (fileUri: string) => Promise<string | null>;
  onBack: () => void;
}

export function EditProfileScreen({
  profile,
  isLoading,
  error,
  onClearError,
  onSave,
  onUploadAvatar,
  onBack,
}: EditProfileScreenProps) {
  const [name, setName] = useState(profile.name ?? '');
  const [surname, setSurname] = useState(profile.surname ?? '');
  const [email, setEmail] = useState(profile.email ?? '');
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

  const bg = useThemeColor('background');
  const text = useThemeColor('text');
  const border = useThemeColor('border');

  useEffect(() => {
    setName(profile.name ?? '');
    setSurname(profile.surname ?? '');
    setEmail(profile.email ?? '');
    setPace(profile.persona?.pace ?? null);
    setInterests(profile.persona?.interests ?? []);
    setJournaling(profile.persona?.journaling ?? null);
    setCompanionship(profile.persona?.companionship ?? null);
    setAvatarUrl(profile.avatarUrl ?? null);
    setAvatarCacheKey(profile.updatedAt ? new Date(profile.updatedAt).getTime() : 0);
  }, [profile]);

  const canSave = name.trim().length > 0 && surname.trim().length > 0;

  const handleSave = async () => {
    const success = await onSave({
      name: name.trim(),
      surname: surname.trim(),
      email: email.trim() || null,
      username: profile.username?.trim() || null,
      avatar_url: avatarUrl,
      bio: profile.bio?.trim() || null,
      pace,
      interests,
      journaling,
      companionship,
    });
    if (success) onBack();
  };

  const handleAvatarPress = async () => {
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
        await onSave({
          name: name.trim(),
          surname: surname.trim(),
          email: email.trim() || null,
          username: profile.username?.trim() || null,
          avatar_url: url,
          bio: profile.bio?.trim() || null,
          pace,
          interests,
          journaling,
          companionship,
        });
      }
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const initials =
    (name[0] ?? '').toUpperCase() + (surname[0] ?? '').toUpperCase() || '?';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={['bottom']}>
      <AppHeader
        variant="light"
        showAdminLabel={profile.role === 'admin'}
        right={
          <TouchableOpacity activeOpacity={0.8} style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={20} color="#18181B" />
          </TouchableOpacity>
        }
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
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onBack}
              activeOpacity={0.8}
            >
              <AppText style={styles.cancelText}>Cancel</AppText>
            </TouchableOpacity>
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
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { color: '#18181B', fontSize: 14, fontWeight: '500' },
  saveBtn: { flex: 1, height: 40, paddingVertical: 0, paddingHorizontal: 0, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FAFAFA', fontSize: 14, fontWeight: '500' },
  notifBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
