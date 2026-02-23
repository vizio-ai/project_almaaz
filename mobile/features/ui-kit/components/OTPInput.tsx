import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
}

export function OTPInput({ length = 6, onComplete }: OTPInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(TextInput | null)[]>(Array(length).fill(null));

  const textColor = useThemeColor('text');
  const borderColor = useThemeColor('border');
  const surfaceColor = useThemeColor('surface');
  const accentColor = useThemeColor('accent');

  const handleChange = useCallback(
    (value: string, index: number) => {
      const digit = value.replace(/\D/g, '').slice(-1);
      const next = [...digits];
      next[index] = digit;
      setDigits(next);

      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
      if (next.every((d) => d) && digit) {
        onComplete(next.join(''));
      }
    },
    [digits, length, onComplete],
  );

  const handleKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits],
  );

  return (
    <View style={styles.row}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(ref) => { inputRefs.current[i] = ref; }}
          style={[
            styles.box,
            {
              borderColor: digit ? textColor : borderColor,
              backgroundColor: surfaceColor,
              color: textColor,
            },
          ]}
          value={digit}
          onChangeText={(v) => handleChange(v, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          selectionColor={accentColor}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  box: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    fontSize: 24,
    fontWeight: '700',
  },
});
