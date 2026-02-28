import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from './_layout';
import { OnboardingStep, useSession } from '@shared/auth';
import { useProfileDependencies } from '@shared/profile';

const OPTIONS = [
  { label: 'Solo' },
  { label: 'Partner' },
  { label: 'Friends' },
  { label: 'Family' },
];

export default function CompanionsScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const { session, markOnboarded } = useSession();
  const { updateOnboardingProfileUseCase } = useProfileDependencies();
  const [selected, setSelected] = useState(data.companionship);

  const handleNext = async () => {
    if (!session?.user.id) return;
    update({ companionship: selected });
    const finalData = { ...data, companionship: selected };
    const result = await updateOnboardingProfileUseCase.execute({
      userId: session.user.id,
      name: finalData.name,
      surname: finalData.surname,
      email: finalData.email,
      birthday: finalData.birthday,
      location: finalData.location,
      pace: finalData.pace,
      interests: finalData.interests,
      journaling: finalData.journaling,
      companionship: finalData.companionship,
    });
    if (result.success) {
      markOnboarded();
      router.replace('/(tabs)/create?fromOnboarding=true');
    } else {
      const errMsg = (result.error?.cause as Error)?.message ?? result.error?.message ?? 'Something went wrong. Please try again.';
      Alert.alert('Error', errMsg);
    }
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
      birthday: finalData.birthday,
      location: finalData.location,
      pace: finalData.pace,
      interests: finalData.interests,
      journaling: finalData.journaling,
      companionship: finalData.companionship,
    });
    if (result.success) {
      markOnboarded();
      router.replace('/(tabs)/create?fromOnboarding=true');
    } else {
      const errMsg = (result.error?.cause as Error)?.message ?? result.error?.message ?? 'Something went wrong. Please try again.';
      Alert.alert('Error', errMsg);
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
