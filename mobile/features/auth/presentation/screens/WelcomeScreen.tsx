import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppLogo, AppText, useThemeColor } from '@shared/ui-kit';
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
  onSignUpPress?: () => void;
  trips?: WelcomeTripCardData[];
}

export function WelcomeScreen({ onLoginPress, onSignUpPress, trips }: WelcomeScreenProps) {
  const handleSignUp = onSignUpPress ?? onLoginPress;
  const { top } = useSafeAreaInsets();
  const displayTrips = trips && trips.length > 0 ? trips : FALLBACK_TRIPS;

  const bg = useThemeColor('background');
  const headerBg = useThemeColor('headerBg');
  const accent = useThemeColor('accent');
  const mainText = useThemeColor('mainText');

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
        <TouchableOpacity onPress={handleSignUp} activeOpacity={0.8}>
          <AppText style={styles.subtitle}>
            Dora is where your trips live. Create an account to plan, document, and share them with your friends.
          </AppText>
        </TouchableOpacity>

        <AppText style={[styles.sectionTitle, { color: mainText }]}>Welcome Stranger</AppText>

        <FeaturedCard onPress={handleSignUp} />

        <AppText style={[styles.subSectionTitle, { color: mainText, marginTop: 24 }]}>Popular Trips</AppText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tripsRow}
        >
          {displayTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={handleSignUp} />
          ))}
        </ScrollView>

        <View style={styles.mapSection}>
          <AppText style={[styles.subSectionTitle, { color: mainText }]}>Start Filling Your Map</AppText>
          <AppText style={[styles.mapSubtitle, { color: '#18181B' }]}>
            Don't let your memories fade. Build your digital footprint and keep your travel stories
            alive forever
          </AppText>
          <RecordTripButton onPress={handleSignUp} />
        </View>
      </ScrollView>

      <View style={{ backgroundColor: '#FFFFFF' }}>
        <BottomBar onTabPress={handleSignUp} />
      </View>
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
    fontSize: 14,
    fontWeight: '400',
    color: '#18181B',
    backgroundColor: '#44FFFF33',
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginHorizontal: -20,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginBottom: 32 },
  subSectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  tripsRow: { gap: 12, paddingRight: 4 },
  mapSection: { marginTop: 32, marginBottom: 14 },
  mapSubtitle: { fontSize: 14, fontWeight: '400', marginBottom: 14 },
});
