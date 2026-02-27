import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { usePopularTrips } from '@shared/trips';
import { AppHeader, AppText, useThemeColor } from '@shared/ui-kit';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const LARGE_PHOTO = require('../../assets/images/large_photo.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const CARD_PHOTO = require('../../assets/images/card_photo.png');

export default function HomeScreen() {
  const { session } = useSession();
  const router = useRouter();
  const { profile } = useProfile(session?.user.id);
  const { trips } = usePopularTrips();

  const headerBg = useThemeColor('headerBg');
  const surfaceAlt = useThemeColor('surfaceAlt');
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const accent = useThemeColor('accent');

  const isGuest = !session;
  const firstName = profile?.name ?? null;

  const handleAuthOrAction = (action?: () => void) => {
    if (isGuest) {
      router.push('/auth');
    } else {
      action?.();
    }
  };

  const FALLBACK_TRIPS = [
    { id: '1', title: 'A breath-taking journey on Tuscany', savedCount: 175, creatorName: 'Bethany', coverImageUrl: null },
    { id: '2', title: 'Ancient temples of Kyoto', savedCount: 238, creatorName: 'Marcus', coverImageUrl: null },
    { id: '3', title: 'Northern lights in Iceland', savedCount: 312, creatorName: 'Sofia', coverImageUrl: null },
  ];

  const displayTrips = trips && trips.length > 0 ? trips : FALLBACK_TRIPS;

  return (
    <View style={[styles.root, { backgroundColor: surfaceAlt }]}>
      <StatusBar barStyle="light-content" backgroundColor={headerBg} />

      <AppHeader
        showAdminLabel={profile?.role === 'admin'}
        right={
          !isGuest ? (
            <TouchableOpacity activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isGuest && (
          <TouchableOpacity onPress={() => router.push('/auth')} activeOpacity={0.8}>
            <AppText style={[styles.banner, { color: text }]}>
              Create an account to meet your travel agent, plan with friends, and discover trips
            </AppText>
          </TouchableOpacity>
        )}

        <AppText style={[styles.welcomeTitle, { color: text }]}>
          {isGuest ? 'Welcome Stranger' : `Welcome, ${firstName ?? 'Traveler'}`}
        </AppText>

        {/* Hero card */}
        <ImageBackground
          source={LARGE_PHOTO}
          style={styles.heroCard}
          imageStyle={styles.heroCardImage}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <AppText style={styles.heroTitle}>Discover new places</AppText>
            <AppText style={styles.heroDate}>Apr 4-9, 2026</AppText>
            <TouchableOpacity
              style={styles.heroCta}
              onPress={() => handleAuthOrAction(() => router.push('/create'))}
              activeOpacity={0.85}
            >
              <AppText style={styles.heroCtaText}>Start a new trip plan</AppText>
              <Ionicons name="arrow-forward" size={14} color="#000000" />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Popular Trips */}
        <AppText style={[styles.sectionTitle, { color: text, paddingHorizontal: 20 }]}>Popular Trips</AppText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tripsRow}
        >
          {displayTrips.map((trip) => {
            const imageSource = trip.coverImageUrl ? { uri: trip.coverImageUrl } : CARD_PHOTO;
            return (
              <TouchableOpacity
                key={trip.id}
                style={[styles.tripCard, { backgroundColor: surfaceAlt }]}
                onPress={() => handleAuthOrAction(() => router.push('/discover'))}
                activeOpacity={0.85}
              >
                <Image source={imageSource} style={styles.tripCardImage} resizeMode="cover" />
                <View style={styles.tripCardInfo}>
                  <AppText style={[styles.tripCardTitle, { color: text }]} numberOfLines={3}>
                    {trip.title}
                  </AppText>
                  <AppText style={[styles.tripCardMeta, { color: secondary }]}>
                    Saved by {trip.savedCount} people
                  </AppText>
                  <AppText style={[styles.tripCardAuthor, { color: secondary }]}>
                    {trip.creatorName}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Start Filling Your Map */}
        <View style={styles.mapSection}>
          <AppText style={[styles.sectionTitle, { color: text }]}>Start Filling Your Map</AppText>
          <AppText style={[styles.mapSubtitle, { color: secondary }]}>
            Don't let your memories fade. Build your digital footprint and keep your travel stories
            alive forever
          </AppText>
          <TouchableOpacity
            style={[styles.mapBtn, { borderColor: accent }]}
            onPress={() => handleAuthOrAction(() => router.push('/my-trips'))}
            activeOpacity={0.85}
          >
            <AppText style={[styles.mapBtnText]}>Record a past trip  →</AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingBottom: 24 },
  banner: {
    fontSize: 13,
    lineHeight: 18,
    backgroundColor: 'rgba(68, 255, 255, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 14,
    overflow: 'hidden',
    height: 220,
    justifyContent: 'flex-end',
    marginBottom: 24,
  },
  heroCardImage: { borderRadius: 14 },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 14,
  },
  heroContent: { padding: 16 },
  heroTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  heroDate: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  heroCtaText: { fontSize: 13, fontWeight: '500', color: '#000000' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  tripsRow: { gap: 12, paddingHorizontal: 20, paddingRight: 20, paddingBottom: 4 },
  tripCard: {
    width: 240,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tripCardImage: {
    width: 90,
    height: 110,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  tripCardInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
    gap: 4,
  },
  tripCardTitle: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
  tripCardMeta: { fontSize: 10 },
  tripCardAuthor: { fontSize: 10 },
  mapSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  mapSubtitle: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  mapBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#000000',
    borderRadius: 22,
    borderWidth: 1,
  },
  mapBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  bottomSpacer: { height: 24 },
});
