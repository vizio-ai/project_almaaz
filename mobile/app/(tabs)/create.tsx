import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { AppHeader, AppText, useThemeColor } from '@shared/ui-kit';

export default function CreateScreen() {
  const bg = useThemeColor('background');
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const buttonPrimary = useThemeColor('buttonPrimary');
  const buttonPrimaryText = useThemeColor('buttonPrimaryText');
  const tertiary = useThemeColor('textTertiary');

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AppHeader />
      <View style={styles.body}>
        <AppText style={[styles.title, { color: text }]}>Plan a new trip</AppText>
        <AppText style={[styles.subtitle, { color: secondary }]}>How would you like to start?</AppText>
        <View style={styles.options}>
          <TouchableOpacity
            style={[styles.option, { backgroundColor: buttonPrimary }]}
            activeOpacity={0.85}
          >
            <AppText style={[styles.optionTitle, { color: buttonPrimaryText }]}>Create with AI</AppText>
            <AppText style={[styles.optionDesc, { color: secondary }]}>
              Let Dora build a personalized plan for you
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.option, styles.optionOutline, { borderColor: border }]}
            activeOpacity={0.85}
          >
            <AppText style={[styles.optionTitle, { color: text }]}>Build Your Own</AppText>
            <AppText style={[styles.optionDesc, { color: secondary }]}>
              Add activities step by step
            </AppText>
          </TouchableOpacity>
        </View>
        <AppText style={[styles.note, { color: tertiary }]}>Coming soon</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, marginBottom: 28 },
  options: { gap: 16 },
  option: {
    borderRadius: 14,
    padding: 20,
  },
  optionOutline: { backgroundColor: 'transparent', borderWidth: 1.5 },
  optionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  optionDesc: { fontSize: 13, lineHeight: 18 },
  note: { marginTop: 32, fontSize: 12, textAlign: 'center' },
});
