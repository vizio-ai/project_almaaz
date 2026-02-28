import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from './_layout';
import { OnboardingStep, useSession } from '@shared/auth';
import { useProfileDependencies } from '@shared/profile';


const OPTIONS = [
  { label: 'Visual Memory', iconSource: require('../../../assets/images/visualmemory.svg').default },
  { label: 'Storyteller', iconSource: require('../../../assets/images/storyteller_icon.svg').default },
  { label: 'Just the moment', iconSource: require('../../../assets/images/justmoment.svg').default },
];

export default function JournalingScreen() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const { session, markOnboarded } = useSession();
  const { updateOnboardingProfileUseCase } = useProfileDependencies();
  const [selected, setSelected] = useState(data.journaling);

  const handleNext = () => {
    update({ journaling: selected });
    router.push('/auth/onboarding/companions');
  };

  const handleFinishLater = async () => {
    if (!session?.user.id) return;
    update({ journaling: selected });
    const finalData = { ...data, journaling: selected };
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
      step={4}
      total={5}
      questionNumber={3}
      question="How do you want to remember the trip?"
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
