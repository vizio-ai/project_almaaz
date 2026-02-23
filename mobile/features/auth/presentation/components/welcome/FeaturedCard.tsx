import React from 'react';
import { View, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import { AppText } from '@shared/ui-kit';
import { Ionicons } from '@expo/vector-icons';

const LARGE_PHOTO = require('../../../../../assets/images/large_photo.png');

interface FeaturedCardProps {
  onPress?: () => void;
}

export function FeaturedCard({ onPress }: FeaturedCardProps) {
  return (
    <ImageBackground
      source={LARGE_PHOTO}
      style={styles.card}
      imageStyle={styles.cardImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <View style={styles.content}>
        <AppText style={styles.title}>Discover new places</AppText>
        <AppText style={styles.date}>Apr 4-9, 2026</AppText>
        <TouchableOpacity style={styles.cta} activeOpacity={0.85} onPress={onPress}>
          <AppText style={styles.ctaText}>Start a new trip plan</AppText>
          <Ionicons name="arrow-forward" size={14} color="#000000" />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
    height: 220,
    justifyContent: 'flex-end',
  },
  cardImage: { borderRadius: 14 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 14,
  },
  content: { padding: 16 },
  title: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  date: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  ctaText: { fontSize: 13, fontWeight: '500', color: '#000000' },
});
