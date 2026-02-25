import React from 'react';
import { useOnboarding } from './_layout';
import { DoraConversationScreen } from '@shared/itinerary';

export default function DoraIntroScreen() {
  const { data } = useOnboarding();

  return (
    <DoraConversationScreen
      userName={data.name}
      persona={{
        pace: data.pace,
        interests: data.interests,
        journaling: data.journaling,
        companionship: data.companionship,
      }}
      isOnboarding
    />
  );
}
