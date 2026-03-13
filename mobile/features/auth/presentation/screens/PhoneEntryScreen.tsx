import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, AppText, LabelText, PrimaryButton, AuthErrorSection, ScreenTitle, ScreenSubtitle, useThemeColor, colors, typography, spacing } from '@shared/ui-kit';
import { COUNTRIES, type Country } from '../../data/config/countries';
import { CountryPicker } from '../components/CountryPicker';
import { PhoneInput } from '../components/PhoneInput';
import { AuthStrings } from '../constants/strings';
import { isPossiblePhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';

const VALIDATION_WARNING = 'You entered your phone number missing or incorrectly.';

interface PhoneEntryScreenProps {
  onSubmit: (phone: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
  mode?: 'signin' | 'signup';
}

export function PhoneEntryScreen({
  onSubmit,
  isLoading,
  error,
  onClearError,
  mode = 'signin',
}: PhoneEntryScreenProps) {
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const bgColor = useThemeColor('background');
  const labelColor = useThemeColor('labelText');
  const accentColor = useThemeColor('borderColor');

  const isValidLength = isPossiblePhoneNumber(phone, selectedCountry.code);

  const handlePhoneChange = useCallback((text: string) => {
    setPhone(text);
    setValidationWarning(null);
  }, []);

  const handleSubmit = useCallback(() => {
    try {
      const parsed = parsePhoneNumberWithError(phone, selectedCountry.code);
      if (!parsed.isValid()) {
        setValidationWarning(VALIDATION_WARNING);
        return;
      }
      setValidationWarning(null);
      onSubmit(parsed.format('E.164'));
    } catch {
      setValidationWarning(VALIDATION_WARNING);
    }
  }, [phone, selectedCountry.code, onSubmit]);

  const hasError = !!error || !!validationWarning;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: bgColor }]}
      edges={hasError ? ['top', 'bottom'] : ['bottom']}
    >
      {hasError && (
        <AuthErrorSection
          error={error}
          warning={validationWarning}
          onDismissError={onClearError}
          onDismissWarning={() => setValidationWarning(null)}
        />
      )}
      {!hasError && <AppHeader />}
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode === 'signup' ? (
            <>
              <AppText style={[styles.signupTitle, { color: labelColor }]}>
                Unlock the full dora<AppText style={{ color: accentColor }}>.</AppText> experience
              </AppText>
              <ScreenSubtitle text="Join with your phone number." />
            </>
          ) : (
            <>
              <ScreenTitle text={AuthStrings.phoneEntry.title} />
              <ScreenSubtitle text={AuthStrings.phoneEntry.subtitle} />
            </>
          )}

          <LabelText>{AuthStrings.phoneEntry.phoneLabel}</LabelText>

          <View style={styles.phoneRow}>
            <CountryPicker
              selectedCountry={selectedCountry}
              onSelect={setSelectedCountry}
            />
            <PhoneInput
              value={phone}
              onChangeText={handlePhoneChange}
              onSubmit={handleSubmit}
              isValid={isValidLength}
              hasError={!!validationWarning}
            />
          </View>

          <PrimaryButton
            label={AuthStrings.phoneEntry.submitButton}
            isLoading={isLoading}
            disabled={isLoading}
            preserveStyle
            onPress={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  root: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing['3xl'],
    justifyContent: 'center',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  signupTitle: {
    ...typography['2xl'],
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
});
