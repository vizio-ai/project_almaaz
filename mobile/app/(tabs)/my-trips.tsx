import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSession } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { useUserTrips, ItinerariesGrid } from '@shared/trips';
import { ManualItineraryScreen } from '@shared/manual-itinerary';
import { AppHeader, useThemeColor } from '@shared/ui-kit';

export default function MyTripsScreen() {
  const { session } = useSession();
  const userId = session?.user.id;
  const { profile } = useProfile(userId);
  const { trips, isLoading, refresh } = useUserTrips(userId);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
  const bg = useThemeColor('background');

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  if (selectedTripId) {
    return (
      <ManualItineraryScreen
        itineraryId={selectedTripId}
        userId={userId ?? ''}
        showHeader
        onBack={() => { setSelectedTripId(null); refresh(); }}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <AppHeader showAdminLabel={profile?.role === 'admin'} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ItinerariesGrid
          trips={trips}
          isLoading={isLoading}
          onTripPress={(trip) => setSelectedTripId(trip.id)}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
});
