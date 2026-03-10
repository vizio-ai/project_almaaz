import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSession } from '@shared/auth';
import { ManualItineraryScreen, ManualItineraryProvider } from '@shared/manual-itinerary';
import { createManualItineraryRepository } from '@/infrastructure/manual-itinerary';

const manualItineraryRepository = createManualItineraryRepository();

export default function ItineraryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const router = useRouter();

  return (
    <ManualItineraryProvider manualItineraryRepository={manualItineraryRepository}>
      <ManualItineraryScreen
        itineraryId={id ?? null}
        userId={session?.user.id ?? ''}
        showHeader
        onBack={() => router.back()}
      />
    </ManualItineraryProvider>
  );
}
