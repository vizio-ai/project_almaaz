import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface DoraInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  multiline?: boolean;
  onImagePicked?: (uri: string) => void;
}

export interface DoraInputHandle {
  focus: () => void;
}

export const DoraInput = forwardRef<DoraInputHandle, DoraInputProps>(
  function DoraInput(
    {
      onSend,
      disabled,
      placeholder = 'Ask Dora anything...',
      multiline = false,
      onImagePicked,
    },
    ref,
  ) {
    const [text, setText] = useState('');
    const inputRef = useRef<TextInput>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const handleSend = () => {
      const trimmed = text.trim();
      if (!trimmed || disabled) return;
      onSend(trimmed);
      setText('');
    };

    const handleAttachmentPress = async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission required',
            'Please allow access to your photo library to attach images.',
          );
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
          allowsEditing: false,
        });
        if (!result.canceled && result.assets?.[0]?.uri) {
          onImagePicked?.(result.assets[0].uri);
        }
      } catch {
        // silently fail
      }
    };

    const handleMicPress = () => {
      inputRef.current?.focus();
      Alert.alert(
        'Voice Input',
        'Use the microphone button on your keyboard to dictate text.',
      );
    };

    return (
      <View style={styles.container}>
        <View style={[styles.inputRow, multiline && styles.inputRowMultiline]}>
          <TouchableOpacity
            style={styles.plusBtn}
            activeOpacity={0.7}
            onPress={handleAttachmentPress}
          >
            <Ionicons name="add" size={22} color="#888888" />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={[styles.input, multiline && styles.inputMultiline]}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor="#AAAAAA"
            multiline={multiline}
            returnKeyType={multiline ? 'default' : 'send'}
            onSubmitEditing={multiline ? undefined : handleSend}
            editable={!disabled}
            textAlignVertical={multiline ? 'top' : 'center'}
          />

          <TouchableOpacity
            style={styles.micBtn}
            activeOpacity={0.7}
            onPress={handleMicPress}
          >
            <Ionicons name="mic-outline" size={20} color="#888888" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || disabled) && styles.sendBtnDisabled]}
            onPress={handleSend}
            activeOpacity={0.8}
            disabled={!text.trim() || disabled}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    borderRadius: 14,
    paddingLeft: 8,
    paddingRight: 6,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    backgroundColor: '#FFFFFF',
  },
  inputRowMultiline: {
    alignItems: 'flex-end',
    minHeight: 56,
  },
  plusBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#18181B',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inputMultiline: {
    maxHeight: 120,
    minHeight: 40,
  },
  micBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#18181B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendBtnDisabled: {
    backgroundColor: '#CCCCCC',
  },
});
