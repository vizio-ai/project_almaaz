import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from './_layout';
import { OnboardingStep, useSession } from '@shared/auth';
import { useProfileDependencies } from '@shared/profile';

const OPTIONS = [
  { label: 'Culture', iconSource: require('../../../assets/images/culture_icon.svg').default },
  { label: 'Food', iconSource: require('../../../assets/images/food.svg').default },
  { label: 'Photo Spots', iconSource: require('../../../assets/images/photo_icon.svg').default },
  { label: 'Shopping', iconSource: require('../../../assets/images/shopping_icon.svg').default },
  { label: 'Nature', iconSource: require('../../../assets/images/nature.svg').default },
];

export default function InterestsScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const { session, markOnboarded } = useSession();
  const { updateOnboardingProfileUseCase } = useProfileDependencies();
  const [selected, setSelected] = useState<string[]>(data.interests);

  const toggle = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleNext = () => {
    update({ interests: selected });
    router.push('/auth/onboarding/journaling');
  };

  const handleFinishLater = async () => {
    if (!session?.user.id) return;
    update({ interests: selected });
    const finalData = { ...data, interests: selected };
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
      step={3}
      total={5}
      questionNumber={2}
      question="What gets you out of bed?"
      options={OPTIONS}
      selected={selected}
      onSelect={toggle}
      multiSelect
      onNext={handleNext}
      onBack={() => router.back()}
      onFinishLater={handleFinishLater}
    />
  );
}
