import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOnboarding } from './_layout';
import { AppLogo, AppInput, PrimaryButton, ProgressBar, ScreenTitle, ScreenSubtitle, useThemeColor } from '@shared/ui-kit';

export default function PersonalScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [name, setName] = useState(data.name);
  const [surname, setSurname] = useState(data.surname);
  const [email, setEmail] = useState(data.email);
  const [showErrors, setShowErrors] = useState(false);

  const bgColor = useThemeColor('background');

  const handleNext = () => {
    const nameValid = name.trim().length > 0;
    const surnameValid = surname.trim().length > 0;

    if (!nameValid || !surnameValid) {
      setShowErrors(true);
      return;
    }

    setShowErrors(false);
    update({ name: name.trim(), surname: surname.trim(), email: email.trim() });
    router.push('/auth/onboarding/pace');
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bgColor }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <ProgressBar step={1} total={5} />
          <View style={styles.logoRow}>
            <AppLogo size="md" />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenTitle text="Let's get to know you" />
          <ScreenSubtitle text="Just a few details so Dora can call you by name and suggest routes starting from your city." />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <AppInput
                label="Name"
                leftIcon="person-outline"
                value={name}
                onChangeText={(v) => { setName(v); setShowErrors(false); }}
                placeholder="John"
                returnKeyType="next"
                autoFocus
                hasError={showErrors && !name.trim()}
              />
            </View>
            <View style={styles.gap} />
            <View style={styles.halfInput}>
              <AppInput
                label="Surname"
                leftIcon="person-outline"
                value={surname}
                onChangeText={(v) => { setSurname(v); setShowErrors(false); }}
                placeholder="Doe"
                returnKeyType="next"
                hasError={showErrors && !surname.trim()}
              />
            </View>
          </View>

          <AppInput
            label="Email"
            optional
            leftIcon="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="johndoe@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
            style={styles.emailInput}
          />

          <View style={styles.spacer} />

          <PrimaryButton label="Next" onPress={handleNext} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 28 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  logoRow: { marginTop: 12 },
  row: { flexDirection: 'row', marginBottom: 16 },
  halfInput: { flex: 1 },
  gap: { width: 12 },
  emailInput: { marginBottom: 16 },
  spacer: { flex: 1, minHeight: 24 },
});
