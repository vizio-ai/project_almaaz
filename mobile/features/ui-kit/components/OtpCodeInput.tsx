import React, { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { AppText } from './AppText';

const BOX_HEIGHT = 64;
const CONTAINER_RADIUS = 6;
const BORDER_INACTIVE = '#E4E4E7';
const BORDER_FOCUS = '#0A0A0A';
const BORDER_ERROR = '#DC2626';

export interface OtpCodeInputRef {
  reset: () => void;
}

interface OtpCodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  /** Called when user types or deletes - e.g. to clear error state. Receives current code. */
  onChange?: (code: string) => void;
  hasError?: boolean;
}

/**
 * OTP input using a single hidden TextInput for proper paste support.
 * Paste, SMS suggestions (oneTimeCode/sms-otp), and keyboard input all work correctly.
 */
export const OtpCodeInput = forwardRef<OtpCodeInputRef, OtpCodeInputProps>(
  function OtpCodeInput(
    { length = 6, onComplete, onChange, hasError = false },
    ref,
  ) {
    const [code, setCode] = useState('');
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const inputRef = useRef<TextInput>(null);

    const digitColor = '#000000';

    useImperativeHandle(ref, () => ({
      reset: () => {
        setCode('');
        setFocusedIndex(0);
        requestAnimationFrame(() => {
          inputRef.current?.focus();
        });
      },
    }));

    const handleChange = useCallback(
      (value: string) => {
        const digitsOnly = value.replace(/\D/g, '').slice(0, length);
        setCode(digitsOnly);
        onChange?.(digitsOnly);
        setFocusedIndex((prev) =>
          prev !== null ? Math.min(digitsOnly.length, length - 1) : prev,
        );

        if (digitsOnly.length === length) {
          onComplete(digitsOnly);
        }
      },
      [length, onComplete, onChange],
    );

    const handleBoxPress = useCallback(() => {
      inputRef.current?.focus();
    }, []);

    const handleKeyPress = useCallback(() => {
      // No-op: single input handles key events natively
    }, []);

    const handleFocus = useCallback(() => {
      setFocusedIndex(Math.min(code.length, length - 1));
    }, [code.length, length]);

    const handleBlur = useCallback(() => {
      setFocusedIndex(null);
    }, []);

    const digits = code.padEnd(length, ' ').split('').slice(0, length);

    return (
      <Pressable
        style={[
          styles.container,
          styles.shadow,
          {
            borderWidth: 1,
            borderColor: hasError ? BORDER_ERROR : BORDER_INACTIVE,
            borderRadius: CONTAINER_RADIUS,
          },
        ]}
        onPress={handleBoxPress}
      >
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          value={code}
          onChangeText={handleChange}
          onKeyPress={handleKeyPress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType="number-pad"
          maxLength={length}
          textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
          autoComplete={Platform.OS === 'android' ? 'sms-otp' : undefined}
          autoCapitalize="none"
          autoCorrect={false}
          caretHidden={false}
          selectTextOnFocus
          accessibilityLabel="One-time verification code"
          accessibilityHint="Enter the 6-digit code from your SMS"
        />
        {digits.map((digit, i) => {
          const isFocused = focusedIndex === i && !hasError;
          const leftBoxFocused = focusedIndex === i - 1 && !hasError;
          const boxBorderColor = isFocused ? BORDER_FOCUS : 'transparent';
          const showSeparator = i > 0 && !leftBoxFocused;
          const separatorColor = hasError
            ? BORDER_ERROR
            : leftBoxFocused
              ? BORDER_FOCUS
              : BORDER_INACTIVE;
          const isFirst = i === 0;
          const isLast = i === length - 1;
          return (
            <React.Fragment key={i}>
              {showSeparator && (
                <View
                  style={[styles.separator, { backgroundColor: separatorColor }]}
                  pointerEvents="none"
                />
              )}
              <View
                style={[
                  styles.box,
                  {
                    backgroundColor: '#FFFFFF',
                    borderWidth: isFocused ? 1 : 0,
                    borderColor: boxBorderColor,
                    borderTopLeftRadius: isFirst ? CONTAINER_RADIUS : 0,
                    borderBottomLeftRadius: isFirst ? CONTAINER_RADIUS : 0,
                    borderTopRightRadius: isLast ? CONTAINER_RADIUS : 0,
                    borderBottomRightRadius: isLast ? CONTAINER_RADIUS : 0,
                  },
                ]}
                pointerEvents="none"
              >
                <AppText style={[styles.digit, { color: digitColor }]}>
                  {digit === ' ' ? '' : digit}
                </AppText>
              </View>
            </React.Fragment>
          );
        })}
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    borderRadius: CONTAINER_RADIUS,
    backgroundColor: '#FFFFFF',
    minHeight: BOX_HEIGHT,
    overflow: 'hidden',
  },
  shadow: {
    shadowColor: '#9CA3AF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 16,
    padding: 0,
  },
  separator: {
    width: 1,
    height: BOX_HEIGHT,
  },
  box: {
    flex: 1,
    height: BOX_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digit: {
    fontSize: 18,
    fontWeight: '400',
  },
});
