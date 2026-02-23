import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from './_layout';
import { useSession } from '@shared/auth';
import { useProfileDependencies } from '@shared/profile';
import { AppLogo, AppText, ErrorBanner, useThemeColor } from '@shared/ui-kit';

export default function DoraIntroScreen() {
  const { data } = useOnboarding();
  const { session, markOnboarded } = useSession();
  const { updateOnboardingProfileUseCase } = useProfileDependencies();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useThemeColor('background');
  const textColor = useThemeColor('text');
  const accentColor = useThemeColor('accent');
  const borderLight = useThemeColor('borderLight');
  const buttonDisabled = useThemeColor('buttonDisabled');
  const buttonPrimary = useThemeColor('buttonPrimary');
  const buttonPrimaryText = useThemeColor('buttonPrimaryText');
  const surfaceAlt = useThemeColor('surfaceAlt');

  const firstName = data.name || 'there';

  const handleStart = async () => {
    if (!session?.user.id) return;

    setIsSaving(true);
    setError(null);

    const result = await updateOnboardingProfileUseCase.execute({
      userId:        session.user.id,
      name:          data.name,
      surname:       data.surname,
      email:         data.email,
      pace:          data.pace,
      interests:     data.interests,
      journaling:    data.journaling,
      companionship: data.companionship,
    });

    setIsSaving(false);

    if (!result.success) {
      setError(result.error.message ?? 'Something went wrong. Please try again.');
      return;
    }

    markOnboarded();
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bgColor }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.logoRow}>
          <AppLogo size="md" />
        </View>

        {error && (
          <ErrorBanner message={error} onDismiss={() => setError(null)} horizontalInset={24} />
        )}

        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: buttonPrimary }]}>
            <AppText style={[styles.avatarText, { color: buttonPrimaryText }]}>D</AppText>
          </View>
        </View>

        <View style={styles.chat}>
          <View style={[styles.doraBubble, { backgroundColor: surfaceAlt }]}>
            <AppText style={[styles.doraName, { color: accentColor }]}>dora.</AppText>
            <AppText style={[styles.doraMsg, { color: textColor }]}>
              Hello {firstName}! I'm dora, your personal travel agent.{'\n\n'}
              I got to know you and your travel preferences. I'll use this to help
              make your adventures feel perfectly personalized.
            </AppText>
          </View>

          <View style={[styles.userBubble, { backgroundColor: buttonPrimary }]}>
            <AppText style={[styles.userMsg, { color: buttonPrimaryText }]}>
              Hi! I'm {firstName}.
              {data.interests.length > 0
                ? ` I love ${data.interests.slice(0, 2).join(' and ').toLowerCase()}.`
                : " Let's plan something amazing."}
            </AppText>
          </View>

          <View style={[styles.doraBubble, { backgroundColor: surfaceAlt }]}>
            <AppText style={[styles.doraName, { color: accentColor }]}>dora.</AppText>
            <AppText style={[styles.doraMsg, { color: textColor }]}>
              Perfect! Now let's start planning your first trip.
            </AppText>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: borderLight, backgroundColor: bgColor }]}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: isSaving ? buttonDisabled : buttonPrimary },
          ]}
          onPress={handleStart}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator color={buttonPrimaryText} />
          ) : (
            <AppText style={[styles.buttonText, { color: buttonPrimaryText }]}>
              Let's start planning your first trip.
            </AppText>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 16 },
  logoRow: { paddingTop: 16, marginBottom: 24 },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 26, fontWeight: '700' },
  chat: { gap: 16 },
  doraBubble: {
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 16,
    maxWidth: '90%',
    alignSelf: 'flex-start',
  },
  doraName: { fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: -0.3 },
  doraMsg: { fontSize: 14, lineHeight: 22 },
  userBubble: {
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 16,
    maxWidth: '85%',
    alignSelf: 'flex-end',
  },
  userMsg: { fontSize: 14, lineHeight: 22 },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  button: { borderRadius: 10, paddingVertical: 16, alignItems: 'center' },
  buttonText: { fontSize: 15, fontWeight: '600' },
});
