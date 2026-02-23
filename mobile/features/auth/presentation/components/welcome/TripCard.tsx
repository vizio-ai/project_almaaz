import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText, useThemeColor } from '@shared/ui-kit';

const FALLBACK_PHOTO = require('../../../../../assets/images/card_photo.png');

export interface WelcomeTripCardData {
  id: string;
  title: string;
  savedCount: number;
  creatorName: string;
  coverImageUrl: string | null;
}

interface TripCardProps {
  trip: WelcomeTripCardData;
  onPress?: () => void;
}

export function TripCard({ trip, onPress }: TripCardProps) {
  const surface = useThemeColor('surfaceAlt');
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');

  const imageSource = trip.coverImageUrl ? { uri: trip.coverImageUrl } : FALLBACK_PHOTO;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: surface }]} onPress={onPress} activeOpacity={0.85}>
      <Image source={imageSource} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <AppText style={[styles.title, { color: text }]} numberOfLines={3}>{trip.title}</AppText>
        <AppText style={[styles.meta, { color: secondary }]}>Saved by {trip.savedCount} people</AppText>
        <AppText style={[styles.author, { color: secondary }]}>{trip.creatorName}</AppText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 240,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: { width: 90, height: 110, borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  info: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    gap: 4,
  },
  title: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  meta: { fontSize: 10 },
  author: { fontSize: 10 },
});
