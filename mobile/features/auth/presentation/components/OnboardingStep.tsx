import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AppText } from '@shared/ui-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { AppLogo, PrimaryButton, ProgressBar, PersonaOption, useThemeColor } from '@shared/ui-kit';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];
type SvgComponent = React.ComponentType<{ width?: number; height?: number; color?: string }>;

export type OnboardingOption =
  | string
  | { label: string; icon?: IoniconsName; iconSource?: SvgComponent };

interface OnboardingStepProps {
  step: number;
  total: number;
  question: string;
  /** Question number label (e.g. 1–4) shown above the question as "Question #1" */
  questionNumber?: number;
  options: OnboardingOption[];
  selected: string[];
  onSelect: (value: string) => void;
  multiSelect: boolean;
  onNext: () => void;
  onBack: () => void;
  /** When provided, shows "Finish Later" button aligned with logo. Completes onboarding on press. */
  onFinishLater?: () => void;
}

export function OnboardingStep({
  step,
  total,
  question,
  questionNumber,
  options,
  selected,
  onSelect,
  multiSelect,
  onNext,
  onBack,
  onFinishLater,
}: OnboardingStepProps) {
  const { top } = useSafeAreaInsets();
  const bgColor = useThemeColor('background');
  const textColor = useThemeColor('text');
  const borderColor = useThemeColor('border');

  const canNext = selected.some((s) => s.length > 0);

  return (
    <View style={[styles.root, { backgroundColor: bgColor }]}>
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <ProgressBar step={step} total={total} />
        <View style={styles.logoRow}>
          <AppLogo size="md" />
          {onFinishLater && (
            <TouchableOpacity
              onPress={onFinishLater}
              style={[styles.finishLaterBtn, { borderColor }]}
              activeOpacity={0.7}
            >
              <AppText style={[styles.finishLaterText, { color: textColor }]}>
                Finish Later
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {questionNumber != null && (
          <AppText style={styles.questionLabel}>Question #{questionNumber}</AppText>
        )}
        <AppText style={[styles.question, { color: textColor }]}>{question}</AppText>

        <View style={styles.options}>
          {options.map((opt) => {
            const label = typeof opt === 'string' ? opt : opt.label;
            const icon = typeof opt === 'string' ? undefined : opt.icon;
            const iconSource = typeof opt === 'string' ? undefined : opt.iconSource;
            return (
              <PersonaOption
                key={label}
                label={label}
                icon={icon}
                iconSource={iconSource}
                isSelected={selected.includes(label)}
                onPress={() => onSelect(label)}
              />
            );
          })}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: bgColor }]}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backBtn, { borderColor }]}
          activeOpacity={0.7}
        >
          <AppText style={[styles.backText, { color: textColor }]}>Back</AppText>
        </TouchableOpacity>
        <View style={styles.nextBtnWrap}>
          <PrimaryButton
            label="Next"
            disabled={!canNext}
            onPress={onNext}
            style={styles.nextBtn}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 28 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  logoRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  finishLaterBtn: {
    width: 82,
    height: 32,
    borderWidth: 1.5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishLaterText: { fontSize: 12, fontWeight: '500', lineHeight: 16, includeFontPadding: false },
  questionLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#71717A',
    marginBottom: 8,
    includeFontPadding: false,
  },
  question: { fontSize: 22, fontWeight: '700', marginBottom: 24, lineHeight: 30 },
  options: { gap: 12 },
  spacer: { flex: 1, minHeight: 24 },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 180,
    paddingTop: 12,
    gap: 8,
  },
  backBtn: {
    width: 92,
    height: 40,
    borderWidth: 1.5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 14, fontWeight: '500', lineHeight: 20, includeFontPadding: false },
  nextBtnWrap: { flex: 2 },
  nextBtn: { height: 40, paddingVertical: 0 },
});
