import React from 'react';
import { View, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { AppText, useThemeColor } from '@shared/ui-kit';
import { TripCard } from '../../../auth/presentation/components/welcome/TripCard';
import { PopularTrip } from '../../domain/entities/PopularTrip';

const COLUMN_GAP = 12;
const NUM_COLUMNS = 2;

interface ItinerariesGridProps {
  trips: PopularTrip[];
  isLoading: boolean;
  /** Total horizontal padding of the parent screen (left + right). Default: 48 */
  horizontalPadding?: number;
  onTripPress?: (trip: PopularTrip) => void;
}

export function ItinerariesGrid({
  trips,
  isLoading,
  horizontalPadding = 48,
  onTripPress,
}: ItinerariesGridProps) {
  const text = useThemeColor('labelText');
  const secondary = useThemeColor('textSecondary');
  const accent = useThemeColor('accent');
  const { width: screenWidth } = useWindowDimensions();

  const cardWidth = Math.floor(
    (screenWidth - horizontalPadding - COLUMN_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS,
  );

  return (
    <View style={styles.container}>
      <AppText style={[styles.title, { color: text }]}>Itineraries</AppText>
      {isLoading ? (
        <ActivityIndicator size="small" color={accent} style={styles.loader} />
      ) : trips.length === 0 ? (
        <AppText style={[styles.empty, { color: secondary }]}>No itineraries yet.</AppText>
      ) : (
        <View style={styles.grid}>
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              width={cardWidth}
              onPress={onTripPress ? () => onTripPress(trip) : undefined}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: COLUMN_GAP,
  },
  loader: {
    marginTop: 16,
  },
  empty: {
    fontSize: 14,
  },
});
