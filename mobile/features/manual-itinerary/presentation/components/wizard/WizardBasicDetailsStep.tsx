import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppText, AppInput, SelectTrigger, ToggleRow, useThemeColor, spacing, typography, radii } from '@shared/ui-kit';
import { WizardBottomActionBar } from './WizardBottomActionBar';
import { TripDateRangeInput } from '../TripDateRangeInput';
import { LocationPickerModal } from '../LocationPickerModal';

const PLACEHOLDER_IMAGE = require('../../../../../assets/images/card_photo.png');

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WizardBasicDetailsStepProps {
  coverUri: string | null;
  onCoverChange: (uri: string) => void;
  onCoverDelete: () => void;
  tripName: string;
  onTripNameChange: (v: string) => void;
  destination: string;
  onDestinationChange: (v: string) => void;
  startDate: Date | null;
  endDate: Date | null;
  onStartDate: (d: Date) => void;
  onEndDate: (d: Date) => void;
  tripNote: string;
  onTripNoteChange: (v: string) => void;
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  isClonable: boolean;
  onIsClonableChange: (value: boolean) => void;
  onCancel: () => void;
  onNext: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WizardBasicDetailsStep({
  coverUri,
  onCoverChange,
  onCoverDelete,
  tripName,
  onTripNameChange,
  destination,
  onDestinationChange,
  startDate,
  endDate,
  onStartDate,
  onEndDate,
  tripNote,
  onTripNoteChange,
  isPublic,
  onIsPublicChange,
  isClonable,
  onIsClonableChange,
  onCancel,
  onNext,
}: WizardBasicDetailsStepProps) {
  const textColor  = useThemeColor('text');
  const secondary  = useThemeColor('textSecondary');
  const border     = useThemeColor('border');
  const errorColor = useThemeColor('error');
  const background = useThemeColor('background');

  const [locationMapVisible, setLocationMapVisible] = useState(false);

  // ── Validation ──────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<{ tripName?: string; destination?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!tripName.trim()) next.tripName = 'Trip name is required';
    if (!destination.trim()) next.destination = 'Destination is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  // Clear individual field errors as the user fills them in
  function handleTripNameChange(v: string) {
    if (errors.tripName && v.trim()) setErrors((prev) => ({ ...prev, tripName: undefined }));
    onTripNameChange(v);
  }

  function handleDestinationChange(v: string) {
    if (errors.destination && v.trim()) setErrors((prev) => ({ ...prev, destination: undefined }));
    onDestinationChange(v);
  }

  // ── Photo helpers ─────────────────────────────────────────────────────────

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      onCoverChange(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow camera access in Settings.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        onCoverChange(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Camera Error', String(e));
    }
  }

  function handlePhotoPress() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) takePhoto();
          else if (index === 2) pickFromLibrary();
        },
      );
    } else {
      Alert.alert('Trip Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.root}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: background }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Trip Photo ─────────────────────────────────────────────── */}
        <AppText style={[styles.fieldLabel, { color: textColor }]}>Trip Photo</AppText>
        <View style={styles.photoRow}>
          <TouchableOpacity onPress={handlePhotoPress} activeOpacity={0.8}>
            <Image
              source={coverUri ? { uri: coverUri } : PLACEHOLDER_IMAGE}
              style={[styles.photoThumb, { borderColor: border }]}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePhotoPress}
            activeOpacity={0.85}
            style={styles.addPhotoBtn}
          >
            <AppText style={styles.addPhotoBtnLabel}>
              {coverUri ? 'Change photo' : 'Add photo'}
            </AppText>
          </TouchableOpacity>
          {coverUri && (
            <TouchableOpacity onPress={onCoverDelete} hitSlop={8}>
              <AppText style={[styles.deleteLabel, { color: secondary }]}>Delete</AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Trip Name ──────────────────────────────────────────────── */}
        <View>
          <AppInput
            label="Trip Name"
            value={tripName}
            onChangeText={handleTripNameChange}
            placeholder="e.g. Summer in Japan"
            returnKeyType="next"
            hasError={!!errors.tripName}
          />
          {errors.tripName ? (
            <AppText style={[styles.errorText, { color: errorColor }]}>{errors.tripName}</AppText>
          ) : null}
        </View>

        {/* ── Destination ────────────────────────────────────────────── */}
        <View style={styles.fieldWrap}>
          <AppText style={[styles.fieldLabel, { color: textColor }]}>Destination</AppText>
          <SelectTrigger
            value={destination}
            placeholder="Select a destination"
            onPress={() => setLocationMapVisible(true)}
            hasError={!!errors.destination}
          />
          {errors.destination ? (
            <AppText style={[styles.errorText, { color: errorColor }]}>{errors.destination}</AppText>
          ) : null}
        </View>

        {/* ── Set Your Dates ─────────────────────────────────────────── */}
        <View style={styles.fieldWrap}>
          <AppText style={[styles.fieldLabel, { color: textColor }]}>Set Your Dates</AppText>
          <View style={[styles.inputBox, { borderColor: border }]}>
            <TripDateRangeInput
              startDate={startDate}
              endDate={endDate}
              onStartDate={onStartDate}
              onEndDate={onEndDate}
            />
          </View>
        </View>

        {/* ── Trip Note ──────────────────────────────────────────────── */}
        <AppInput
          label="Trip Note"
          value={tripNote}
          onChangeText={onTripNoteChange}
          placeholder="Add notes about your trip..."
          multiline
          numberOfLines={4}
          inputStyle={styles.textareaInputWrap}
        />

        {/* ── Toggles ─────────────────────────────────────────────────── */}
        <ToggleRow
          label="Allow other users to clone"
          value={isClonable}
          onValueChange={onIsClonableChange}
          infoMessage="This lets other users use your itinerary as a starting point to plan their own trip."
        />
        <ToggleRow
          label={isPublic ? 'Public itinerary' : 'Private itinerary'}
          value={isPublic}
          onValueChange={onIsPublicChange}
          infoMessage="When public, other users may see this itinerary in discover or shared views. When private, only you can see it."
        />
      </ScrollView>

      <WizardBottomActionBar
        leftLabel="Cancel"
        onLeftPress={onCancel}
        rightLabel="Next"
        onRightPress={handleNext}
      />

      {/* ── Location picker modal ────────────────────────────────────── */}
      <LocationPickerModal
        visible={locationMapVisible}
        onSelect={handleDestinationChange}
        onClose={() => setLocationMapVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: 16,
  },

  // Photo row
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  photoThumb: {
    width: 76,
    height: 76,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  addPhotoBtn: {
    backgroundColor: '#18181B',
    borderRadius: radii.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  addPhotoBtnLabel: {
    color: '#fff',
    ...typography.sm,
    fontWeight: '500',
  },
  deleteLabel: {
    ...typography.sm,
  },

  // Fields – label to input 8px
  fieldWrap: { gap: 8 },
  fieldLabel: {
    ...typography.sm,
    fontWeight: '500',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
    maxHeight: 400,
  },
  inputText: {
    ...typography.sm,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  textareaBox: {
    borderWidth: 1,
    borderRadius: radii.sm,
    padding: spacing.md,
    minHeight: 100,
  },
  textareaInput: {
    ...typography.sm,
    flex: 1,
  },
  textareaInputWrap: {
    minHeight: 100,
  },
  errorText: {
    ...typography.xs,
    marginTop: 4,
  },

});
