import React, { useState } from 'react';
import {
  View,
  TextInput,
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
import { Ionicons } from '@expo/vector-icons';
import { AppText, PrimaryButton, ToggleRow, useThemeColor, spacing, typography, radii } from '@shared/ui-kit';
import { TripDateRangeInput } from '../TripDateRangeInput';
import { DestinationPickerModal } from './DestinationPickerModal';

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
  const background = useThemeColor('background');

  const [destinationPickerVisible, setDestinationPickerVisible] = useState(false);

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
        <View style={styles.fieldWrap}>
          <AppText style={[styles.fieldLabel, { color: textColor }]}>Trip Name</AppText>
          <View style={[styles.inputBox, { borderColor: border }]}>
            <TextInput
              style={[styles.inputText, { color: textColor }]}
              placeholder="e.g. Summer in Japan"
              placeholderTextColor={secondary}
              value={tripName}
              onChangeText={onTripNameChange}
              returnKeyType="next"
            />
          </View>
        </View>

        {/* ── Destination ────────────────────────────────────────────── */}
        <View style={styles.fieldWrap}>
          <AppText style={[styles.fieldLabel, { color: textColor }]}>Destination</AppText>
          <TouchableOpacity
            style={[styles.inputBox, { borderColor: border }]}
            onPress={() => setDestinationPickerVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={14} color={secondary} />
            <AppText
              style={[
                styles.inputText,
                { color: destination.trim() ? textColor : secondary, flex: 1 },
              ]}
              numberOfLines={1}
            >
              {destination.trim() || 'Select a destination'}
            </AppText>
            <Ionicons name="chevron-forward" size={16} color={secondary} />
          </TouchableOpacity>
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
        <View style={styles.fieldWrap}>
          <AppText style={[styles.fieldLabel, { color: textColor }]}>Trip Note</AppText>
          <View style={[styles.textareaBox, { borderColor: border }]}>
            <TextInput
              style={[styles.textareaInput, { color: textColor }]}
              placeholder="Add notes about your trip..."
              placeholderTextColor={secondary}
              value={tripNote}
              onChangeText={onTripNoteChange}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

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

      {/* ── Bottom action bar ──────────────────────────────────────────── */}
      <View style={[styles.bottomBar, { borderTopColor: border, backgroundColor: background }]}>
        <PrimaryButton
          variant="outline"
          label="Cancel"
          onPress={onCancel}
          style={styles.actionBtn}
        />
        <PrimaryButton
          label="Next"
          onPress={onNext}
          style={styles.actionBtn}
        />
      </View>

      {/* ── Location map picker modal ──────────────────────────────────── */}
      <LocationMapModal
        visible={locationMapVisible}
        initialQuery={destination}
        onSelect={onDestinationChange}
        onClose={() => setLocationMapVisible(false)}
        allowPointPick={false}
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
    gap: spacing.lg,
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

  // Fields
  fieldWrap: { gap: spacing.xs },
  fieldLabel: {
    ...typography.sm,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    minHeight: 40,
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
