import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo, AppText, useThemeColor } from '@shared/ui-kit';
import { RevealOverlay } from '../components/welcome/RevealOverlay';
import { BottomBar } from '../components/welcome/BottomBar';
import { FeaturedCard } from '../components/welcome/FeaturedCard';
import { TripCard, type WelcomeTripCardData } from '../components/welcome/TripCard';
import { LoginButton } from '../components/welcome/LoginButton';
import { RecordTripButton } from '../components/welcome/RecordTripButton';

const FALLBACK_TRIPS: WelcomeTripCardData[] = [
  { id: '1', title: 'A breath-taking journey on Tuscany', savedCount: 175, creatorName: 'Bethany', coverImageUrl: null },
  { id: '2', title: 'Ancient temples of Kyoto', savedCount: 238, creatorName: 'Marcus', coverImageUrl: null },
  { id: '3', title: 'Northern lights in Iceland', savedCount: 312, creatorName: 'Sofia', coverImageUrl: null },
];

interface WelcomeScreenProps {
  onLoginPress: () => void;
  trips?: WelcomeTripCardData[];
}

export function WelcomeScreen({ onLoginPress, trips }: WelcomeScreenProps) {
  const { top } = useSafeAreaInsets();
  const displayTrips = trips && trips.length > 0 ? trips : FALLBACK_TRIPS;

  const bg = useThemeColor('background');
  const headerBg = useThemeColor('headerBg');
  const accent = useThemeColor('accent');
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      <View style={[styles.heroSection, { paddingTop: top + 12, backgroundColor: headerBg, borderBottomColor: accent }]}>
        <View style={styles.headerRow}>
          <AppLogo size="md" onDark />
          <LoginButton onPress={onLoginPress} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={onLoginPress} activeOpacity={0.8}>
          <AppText style={[styles.subtitle, { color: text }]}>
            Create an account to meet your travel agent, plan with friends, and discover trips
          </AppText>
        </TouchableOpacity>

        <AppText style={[styles.sectionTitle, { color: text }]}>Welcome Stranger</AppText>

        <FeaturedCard onPress={onLoginPress} />

        <AppText style={[styles.sectionTitle, { color: text, marginTop: 24 }]}>Popular Trips</AppText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tripsRow}
        >
          {displayTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={onLoginPress} />
          ))}
        </ScrollView>

        <View style={styles.mapSection}>
          <AppText style={[styles.sectionTitle, { color: text }]}>Start Filling Your Map</AppText>
          <AppText style={[styles.mapSubtitle, { color: secondary }]}>
            Don't let your memories fade. Build your digital footprint and keep your travel stories
            alive forever
          </AppText>
          <RecordTripButton onPress={onLoginPress} />
        </View>
      </ScrollView>

      <BottomBar onTabPress={onLoginPress} />
      <RevealOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 18,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 16 },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    backgroundColor: 'rgba(68, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: -20,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  tripsRow: { gap: 12, paddingRight: 4, paddingBottom: 4 },
  mapSection: { marginTop: 8, marginBottom: 8 },
  mapSubtitle: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
});
