import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { Stack } from 'expo-router';

// ─── Onboarding context (shared across steps) ────────────────────────────────

export interface OnboardingData {
  name: string;
  surname: string;
  email: string;
  pace: string;
  interests: string[];
  journaling: string;
  companionship: string;
}

interface OnboardingContextValue {
  data: OnboardingData;
  update: (partial: Partial<OnboardingData>) => void;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  data: { name: '', surname: '', email: '', pace: '', interests: [], journaling: '', companionship: '' },
  update: () => {},
});

export function useOnboarding() {
  return useContext(OnboardingContext);
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function OnboardingLayout() {
  const [data, setData] = useState<OnboardingData>({
    name: '',
    surname: '',
    email: '',
    pace: '',
    interests: [],
    journaling: '',
    companionship: '',
  });

  const update = (partial: Partial<OnboardingData>) =>
    setData((prev) => ({ ...prev, ...partial }));

  return (
    <OnboardingContext.Provider value={{ data, update }}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="personal" />
        <Stack.Screen name="pace" />
        <Stack.Screen name="interests" />
        <Stack.Screen name="journaling" />
        <Stack.Screen name="companions" />
        <Stack.Screen name="dora-intro" />
      </Stack>
    </OnboardingContext.Provider>
  );
}
