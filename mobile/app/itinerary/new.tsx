import React from 'react';
import { useRouter } from 'expo-router';
import { useSession } from '@shared/auth';
import { ManualItineraryScreen, ManualItineraryProvider } from '@shared/manual-itinerary';
import { createManualItineraryRepository } from '@/infrastructure/manual-itinerary';

const manualItineraryRepository = createManualItineraryRepository();

export default function NewItineraryScreen() {
  const { session } = useSession();
  const router = useRouter();

  return (
    <ManualItineraryProvider manualItineraryRepository={manualItineraryRepository}>
      <ManualItineraryScreen
        itineraryId={null}
        userId={session?.user.id ?? ''}
        showHeader
        onBack={() => router.back()}
      />
    </ManualItineraryProvider>
  );
}
