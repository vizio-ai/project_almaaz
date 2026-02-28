import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText, useThemeColor } from '@shared/ui-kit';
import AnonymousUserIcon from '../../../../../assets/images/anonymous_user_icon.svg';
import BookmarkIcon from '../../../../../assets/images/bookmark_vector.svg';

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
  width?: number;
}

export function TripCard({ trip, onPress, width }: TripCardProps) {
  const surface = useThemeColor('surfaceAlt');
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');

  const cardWidth = width ?? 183;
  const imageHeight = Math.round(cardWidth * (110 / 183));
  const imageSource = trip.coverImageUrl ? { uri: trip.coverImageUrl } : FALLBACK_PHOTO;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: surface, width: cardWidth }]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        <Image source={imageSource} style={[styles.image, { width: cardWidth, height: imageHeight }]} resizeMode="cover" />
        <View style={styles.badge}>
          <BookmarkIcon width={9.33} height={12} />
          <AppText style={styles.badgeText}>{trip.savedCount} Saved</AppText>
        </View>
      </View>
      <View style={styles.info}>
        <AppText style={[styles.title, { color: text }]} numberOfLines={3}>{trip.title}</AppText>
        <View style={styles.authorRow}>
          <AnonymousUserIcon width={12} height={12} />
          <AppText style={[styles.author, { color: secondary }]}>{trip.creatorName}</AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E4E4E7',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 1.5,
    elevation: 3,
  },
  image: {},
  info: {
    padding: 10,
    gap: 4,
  },
  title: { fontSize: 14, fontWeight: '500', paddingBottom: 4 },
  meta: { fontSize: 10 },
  imageWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 95,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  author: { fontSize: 12, fontWeight: '400' },
});
