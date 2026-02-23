import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from './_layout';
import { OnboardingStep, useSession } from '@shared/auth';
import { useProfileDependencies } from '@shared/profile';

const OPTIONS = [
  { label: 'Solo', icon: 'person-outline' as const },
  { label: 'Friends', icon: 'people-outline' as const },
  { label: 'Family', icon: 'home-outline' as const },
  { label: 'Partner', icon: 'heart-outline' as const },
];

export default function CompanionsScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const { session, markOnboarded } = useSession();
  const { updateOnboardingProfileUseCase } = useProfileDependencies();
  const [selected, setSelected] = useState(data.companionship);

  const handleNext = () => {
    update({ companionship: selected });
    router.push('/auth/onboarding/dora-intro');
  };

  const handleFinishLater = async () => {
    if (!session?.user.id) return;
    update({ companionship: selected });
    const finalData = { ...data, companionship: selected };
    const result = await updateOnboardingProfileUseCase.execute({
      userId: session.user.id,
      name: finalData.name,
      surname: finalData.surname,
      email: finalData.email,
      pace: finalData.pace,
      interests: finalData.interests,
      journaling: finalData.journaling,
      companionship: finalData.companionship,
    });
    if (result.success) {
      markOnboarded();
    } else {
      Alert.alert('Error', result.error?.message ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <OnboardingStep
      step={5}
      total={5}
      questionNumber={4}
      question="Who do you usually travel with?"
      options={OPTIONS}
      selected={[selected]}
      onSelect={setSelected}
      multiSelect={false}
      onNext={handleNext}
      onBack={() => router.back()}
      onFinishLater={handleFinishLater}
    />
  );
}
