import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from './_layout';
import { OnboardingStep, useSession } from '@shared/auth';
import { useProfileDependencies } from '@shared/profile';

const TimeIcon = require('../../../assets/images/time_icon.svg').default;
const FlexibleIcon = require('../../../assets/images/flexible_icon.svg').default;

const OPTIONS = [
  { label: 'Planned and Fast', iconSource: TimeIcon },
  { label: 'Relaxed and Flexible', iconSource: FlexibleIcon },
];

export default function PaceScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const { session, markOnboarded } = useSession();
  const { updateOnboardingProfileUseCase } = useProfileDependencies();
  const [selected, setSelected] = useState(data.pace);

  const handleNext = () => {
    update({ pace: selected });
    router.push('/auth/onboarding/interests');
  };

  const handleFinishLater = async () => {
    if (!session?.user.id) return;
    update({ pace: selected });
    const finalData = { ...data, pace: selected };
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
    } else {
      Alert.alert('Error', result.error?.message ?? 'Something went wrong. Please try again.');
    }
  };

  return (
    <OnboardingStep
      step={2}
      total={5}
      questionNumber={1}
      question="How do you like to explore?"
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
