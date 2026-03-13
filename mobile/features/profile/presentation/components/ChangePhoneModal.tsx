import React, { useState, useCallback } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isPossiblePhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js';
import {
  AppText,
  PrimaryButton,
  OtpCodeInput,
  ResendCodeBlock,
  useThemeColor,
  spacing,
  typography,
} from '@shared/ui-kit';
import { CountryPicker, PhoneInput, COUNTRIES, type Country } from '@shared/auth';
import { supabase } from '../../../../infrastructure/supabase';

const OTP_LENGTH = 6;

// ─── Edge Function caller ────────────────────────────────────────────────────

async function callChangePhone(body: Record<string, string>): Promise<{ data: any; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('change-phone', { body });

  if (error) {
    let message = error.message;
    try {
      // Prefer context.json() — body is not consumed by supabase-js before error creation
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === 'function') {
        const parsed = await ctx.json();
        if (parsed?.error) message = parsed.error;
      }
    } catch {
      // Fall back to error.message
    }
    return { data: null, error: message };
  }

  if (data?.error) {
    return { data: null, error: data.error };
  }

  return { data, error: null };
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface ChangePhoneModalProps {
  visible: boolean;
  currentPhone: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ChangePhoneModal({
  visible,
  currentPhone,
  onClose,
  onSuccess,
}: ChangePhoneModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneE164, setPhoneE164] = useState('');
  const [, setCode] = useState('');
  const [otpKey, setOtpKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bg = useThemeColor('background');
  const text = useThemeColor('text');
  const subText = useThemeColor('subText');
  const border = useThemeColor('border');
  const errorColor = useThemeColor('error');

  const isValidLength = isPossiblePhoneNumber(phone, selectedCountry.code);

  const reset = useCallback(() => {
    setStep('phone');
    setPhone('');
    setPhoneE164('');
    setCode('');
    setOtpKey(0);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────

  const handleSendOtp = useCallback(async () => {
    try {
      const parsed = parsePhoneNumberWithError(phone, selectedCountry.code);
      if (!parsed.isValid()) {
        setError('Please enter a valid phone number.');
        return;
      }

      const e164 = parsed.format('E.164');

      // Don't allow same phone
      if (currentPhone && e164.replace(/\D/g, '') === currentPhone.replace(/\D/g, '')) {
        setError('This is already your current phone number.');
        return;
      }

      setIsLoading(true);
      setError(null);

      const { error: apiError } = await callChangePhone({ action: 'send-otp', phone: e164 });

      if (apiError) {
        setError(apiError);
        return;
      }

      setPhoneE164(e164);
      setStep('otp');
    } catch (e) {
      console.error('change-phone send-otp error:', e);
      setError(e instanceof Error ? e.message : 'Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [phone, selectedCountry, currentPhone]);

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────

  const handleVerifyOtp = useCallback(
    async (submittedCode: string) => {
      if (submittedCode.length !== OTP_LENGTH) return;

      setIsLoading(true);
      setError(null);

      try {
        const { error: apiError } = await callChangePhone({
          action: 'verify',
          phone: phoneE164,
          code: submittedCode,
        });

        if (apiError) {
          setError(apiError);
          return;
        }

        reset();
        onSuccess();
      } catch {
        setError('Connection error. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [phoneE164, reset, onSuccess],
  );

  const handleResend = useCallback(async () => {
    setError(null);
    setOtpKey((k) => k + 1);
    setCode('');
    try {
      await callChangePhone({ action: 'send-otp', phone: phoneE164 });
    } catch {
      setError('Failed to resend code.');
    }
  }, [phoneE164]);

  const maskedPhone = phoneE164.replace(/(\d{3})\d+(\d{2})/, '$1***$2');

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.root, { backgroundColor: bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: border }]}>
          <AppText style={[styles.headerTitle, { color: text }]}>
            {step === 'phone' ? 'Change Phone Number' : 'Verify New Number'}
          </AppText>
          <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
            <AppText style={[styles.headerClose, { color: subText }]}>Cancel</AppText>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {step === 'phone' ? (
              <>
                {/* Current phone */}
                {currentPhone && (
                  <View style={styles.currentPhoneWrap}>
                    <AppText style={[styles.label, { color: subText }]}>Current number</AppText>
                    <AppText style={[styles.currentPhone, { color: text }]}>{currentPhone}</AppText>
                  </View>
                )}

                {/* New phone input */}
                <AppText style={[styles.label, { color: text }]}>New phone number</AppText>
                <View style={styles.phoneRow}>
                  <CountryPicker
                    selectedCountry={selectedCountry}
                    onSelect={setSelectedCountry}
                  />
                  <PhoneInput
                    value={phone}
                    onChangeText={(t) => {
                      setPhone(t);
                      setError(null);
                    }}
                    onSubmit={handleSendOtp}
                    isValid={isValidLength}
                    hasError={!!error}
                  />
                </View>

                {error && (
                  <AppText style={[styles.errorText, { color: errorColor }]}>{error}</AppText>
                )}

                <PrimaryButton
                  label="Send Verification Code"
                  onPress={handleSendOtp}
                  isLoading={isLoading}
                  disabled={isLoading}
                  preserveStyle
                />
              </>
            ) : (
              <>
                <AppText style={[styles.subtitle, { color: subText }]}>
                  Enter the 6-digit code sent to {maskedPhone}
                </AppText>

                <OtpCodeInput
                  key={otpKey}
                  length={OTP_LENGTH}
                  onComplete={handleVerifyOtp}
                  onChange={(c) => {
                    setCode(c);
                    setError(null);
                  }}
                  hasError={!!error}
                />

                {error && (
                  <AppText style={[styles.errorText, { color: errorColor }]}>{error}</AppText>
                )}

                {isLoading && (
                  <ActivityIndicator style={styles.loader} />
                )}

                <ResendCodeBlock
                  label="Didn't receive the code?"
                  actionText="Send Again"
                  onPress={handleResend}
                />

                <TouchableOpacity
                  onPress={() => {
                    setStep('phone');
                    setError(null);
                    setCode('');
                  }}
                  style={styles.backLink}
                  activeOpacity={0.7}
                >
                  <AppText style={[styles.backLinkText, { color: text }]}>
                    Use a different number
                  </AppText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...typography.base,
    fontWeight: typography.weights.bold,
  },
  headerClose: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  currentPhoneWrap: {
    marginBottom: 24,
  },
  currentPhone: {
    ...typography.base,
    fontWeight: typography.weights.medium,
    marginTop: 4,
  },
  label: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.sm,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  subtitle: {
    ...typography.sm,
    marginBottom: 24,
    lineHeight: 20,
  },
  errorText: {
    ...typography.xs,
    marginBottom: 12,
  },
  loader: {
    marginVertical: 12,
  },
  backLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  backLinkText: {
    ...typography.sm,
    fontWeight: typography.weights.medium,
    textDecorationLine: 'underline',
  },
});
