import React from 'react';
import { TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { typography } from '../theme';

const PLACEHOLDER = 'A breath-taking journey on Tuscany';
const TITLE_COLOR = '#18181B';
const PLACEHOLDER_COLOR = '#A1A1AA';

export interface TripTitleInputProps {
  /** Current title value. */
  value: string;
  /** Called when the user edits the title. When undefined the field is display-only. */
  onChange?: (text: string) => void;
  /** Additional TextInput props (e.g. onBlur, returnKeyType). Ignored in display mode. */
  inputProps?: Omit<TextInputProps, 'value' | 'onChangeText' | 'style' | 'placeholder' | 'placeholderTextColor'>;
}

export function TripTitleInput({ value, onChange, inputProps }: TripTitleInputProps) {
  if (!onChange) {
    return (
      <AppText style={styles.title} numberOfLines={2}>
        {value || PLACEHOLDER}
      </AppText>
    );
  }

  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={PLACEHOLDER}
      placeholderTextColor={PLACEHOLDER_COLOR}
      style={styles.input}
      multiline={false}
      returnKeyType="done"
      {...inputProps}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: typography.xl.fontSize,
    fontWeight: typography.weights.semibold,
    color: TITLE_COLOR,
  },
  input: {
    fontSize: typography.xl.fontSize,
    fontWeight: typography.weights.semibold,
    color: TITLE_COLOR,
    padding: 0,
  },
});
