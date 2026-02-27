import React, { useState, useCallback } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppHeader,
  PrimaryButton,
  AuthErrorSection,
  ScreenTitle,
  ScreenSubtitle,
  OtpCodeInput,
  ResendCodeBlock,
  useThemeColor,
} from '@shared/ui-kit';
import { AuthStrings } from '../constants/strings';
import { LegalModal, type LegalModalType } from '../components/LegalModal';

const OTP_LENGTH = 6;

interface OtpVerificationScreenProps {
  phone: string;
  onSubmit: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onClearError: () => void;
}

export function OtpVerificationScreen({
  phone,
  onSubmit,
  onResend,
  isLoading,
  error,
  onClearError,
}: OtpVerificationScreenProps) {
  const [code, setCode] = useState('');
  const [otpKey, setOtpKey] = useState(0);
  const [legalModal, setLegalModal] = useState<LegalModalType | null>(null);

  const bgColor = useThemeColor('background');

  const handleOtpChange = useCallback((newCode: string) => {
    setCode(newCode);
    onClearError();
  }, [onClearError]);

  const handleResend = useCallback(async () => {
    setOtpKey((k) => k + 1);
    setCode('');
    onClearError();
    await onResend();
  }, [onClearError, onResend]);

  const handleSubmit = useCallback(() => {
    if (code.length === OTP_LENGTH) onSubmit(code);
  }, [code, onSubmit]);

  const maskedPhone = phone.replace(/(\d{3})\d+(\d{2})/, '$1***$2');
  const codeComplete = code.length === OTP_LENGTH;
  const hasError = !!error;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: bgColor }]}
      edges={hasError ? ['top', 'bottom'] : ['bottom']}
    >
      {hasError && (
        <AuthErrorSection
          warning={error}
          onDismissWarning={onClearError}
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
          <View style={styles.content}>
          <ScreenTitle text={AuthStrings.otpVerification.title} />
          <ScreenSubtitle text={AuthStrings.otpVerification.subtitle(maskedPhone)} />

          <OtpCodeInput
            key={otpKey}
            length={OTP_LENGTH}
            onComplete={onSubmit}
            onChange={handleOtpChange}
            hasError={hasError}
          />

          <PrimaryButton
            label={AuthStrings.otpVerification.submitButton}
            isLoading={isLoading}
            disabled={!codeComplete}
            preserveStyle
            onPress={handleSubmit}
          />

          <ResendCodeBlock
            label={AuthStrings.otpVerification.resendLabel}
            actionText={AuthStrings.otpVerification.resendAction}
            onPress={handleResend}
          />

          <View style={styles.legalRow}>
            <Text style={styles.legalText}>By submitting the code, you agree to our </Text>
            <TouchableOpacity onPress={() => setLegalModal('terms')} activeOpacity={0.7}>
              <Text style={styles.legalLink}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.legalText}> and </Text>
            <TouchableOpacity onPress={() => setLegalModal('privacy')} activeOpacity={0.7}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </TouchableOpacity>
            <Text style={styles.legalText}>.</Text>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LegalModal
        visible={legalModal !== null}
        type={legalModal ?? 'terms'}
        onClose={() => setLegalModal(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'center' },
  content: { flex: 1 },
  legalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  legalText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#71717A',
  },
  legalLink: {
    fontSize: 12,
    fontWeight: '400',
    color: '#0A0A0A',
    textDecorationLine: 'underline',
  },
});
