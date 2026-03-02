import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { radii } from '../theme';

const DEFAULT_COVER = require('../../../assets/images/card_photo.png');

export interface CoverImagePickerProps {
  /** Remote or local URI of the currently selected image. */
  imageUri?: string | null;
  /** Called with the new local file URI after the user picks or takes a photo. */
  onChange?: (localUri: string) => void;
  /** When false the image is display-only (no press handler). Defaults to true. */
  editable?: boolean;
}

export function CoverImagePicker({
  imageUri,
  onChange,
  editable = true,
}: CoverImagePickerProps) {
  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow photo library access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      onChange?.(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please go to Settings and allow camera access for this app.',
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        onChange?.(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Camera Error', String(e));
    }
  }

  function handlePress() {
    if (!editable) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (index) => {
          if (index === 1) takePhoto();
          else if (index === 2) pickFromLibrary();
        },
      );
    } else {
      Alert.alert('Cover Photo', 'Choose an option', [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickFromLibrary },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  }

  const source = imageUri ? { uri: imageUri } : DEFAULT_COVER;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={editable ? 0.85 : 1}
      disabled={!editable}
    >
      <Image source={source} style={styles.image} resizeMode="cover" />
      {editable && (
        <View style={styles.editBadge}>
          <Ionicons name="camera-outline" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  editBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 20,
    padding: 6,
  },
});
