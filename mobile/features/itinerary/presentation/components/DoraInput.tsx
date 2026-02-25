import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DoraInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function DoraInput({ onSend, disabled, placeholder = 'Ask Dora anything...' }: DoraInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.plusBtn} activeOpacity={0.7}>
          <Ionicons name="add" size={22} color="#888888" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#AAAAAA"
          multiline={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!disabled}
        />

        <TouchableOpacity style={styles.micBtn} activeOpacity={0.7}>
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
}

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
