import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  Image,
  type ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { usePopularTrips } from '@shared/trips';
import { AppHeader, AppText, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';
import type { PopularTrip } from '@shared/trips';

const FALLBACK_TRIPS: PopularTrip[] = [
  { id: '1', title: 'A breath-taking journey on Tuscany', savedCount: 175, creatorName: 'Bethany', coverImageUrl: null },
  { id: '2', title: 'Ancient temples of Kyoto', savedCount: 238, creatorName: 'Marcus', coverImageUrl: null },
  { id: '3', title: 'Northern lights in Iceland', savedCount: 312, creatorName: 'Sofia', coverImageUrl: null },
];

export interface HomeScreenProps {
  heroImage: ImageSourcePropType;
  cardPhotoFallback: ImageSourcePropType;
}

export function HomeScreen({ heroImage, cardPhotoFallback }: HomeScreenProps) {
  const { session } = useSession();
  const router = useRouter();
  const { profile } = useProfile(session?.user.id);
  const { trips } = usePopularTrips();

  const headerBg = useThemeColor('headerBg');
  const surfaceAlt = useThemeColor('surfaceAlt');
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const accent = useThemeColor('accent');
  const buttonPrimary = useThemeColor('buttonPrimary');
  const buttonPrimaryText = useThemeColor('buttonPrimaryText');

  const isGuest = !session;
  const firstName = profile?.name ?? null;

  const handleAuthOrAction = (action?: () => void) => {
    if (isGuest) {
      router.push('/auth');
    } else {
      action?.();
    }
  };

  const displayTrips = trips && trips.length > 0 ? trips : FALLBACK_TRIPS;

  return (
    <View style={[styles.root, { backgroundColor: surfaceAlt }]}>
      <StatusBar barStyle="light-content" backgroundColor={headerBg} />

      <AppHeader
        showAdminLabel={profile?.role === 'admin'}
        right={
          !isGuest ? (
            <TouchableOpacity activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={24} color={buttonPrimaryText} />
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
          source={heroImage}
          style={styles.heroCard}
          imageStyle={styles.heroCardImage}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <AppText style={[styles.heroTitle, { color: buttonPrimaryText }]}>Discover new places</AppText>
            <AppText style={[styles.heroDate, { color: buttonPrimaryText }]}>Apr 4-9, 2026</AppText>
            <TouchableOpacity
              style={[styles.heroCta, { backgroundColor: buttonPrimaryText }]}
              onPress={() => handleAuthOrAction(() => router.push('/create'))}
              activeOpacity={0.85}
            >
              <AppText style={[styles.heroCtaText, { color: buttonPrimary }]}>Start a new trip plan</AppText>
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
            const imageSource = trip.coverImageUrl ? { uri: trip.coverImageUrl } : cardPhotoFallback;
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
            style={[styles.mapBtn, { backgroundColor: buttonPrimary, borderColor: accent }]}
            onPress={() => handleAuthOrAction(() => router.push('/my-trips'))}
            activeOpacity={0.85}
          >
            <AppText style={[styles.mapBtnText, { color: buttonPrimaryText }]}>Record a past trip  →</AppText>
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
  scrollContent: { paddingTop: spacing['2xl'], paddingBottom: spacing['2xl'] },
  banner: {
    ...typography.caption,
    lineHeight: 18,
    backgroundColor: 'rgba(68, 255, 255, 0.15)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    ...typography.featured,
    fontWeight: typography.weights.bold,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  heroCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radii.xl,
    overflow: 'hidden',
    height: 220,
    justifyContent: 'flex-end',
    marginBottom: spacing['2xl'],
  },
  heroCardImage: { borderRadius: radii.xl },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: radii.xl,
  },
  heroContent: { padding: spacing.lg },
  heroTitle: { ...typography.lg, fontWeight: typography.weights.bold, marginBottom: spacing.xs },
  heroDate: { ...typography.xs, marginBottom: spacing.md },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  heroCtaText: { ...typography.caption, fontWeight: typography.weights.medium },
  sectionTitle: {
    ...typography.lg,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  tripsRow: { gap: spacing.md, paddingHorizontal: spacing.xl, paddingRight: spacing.xl, paddingBottom: spacing.xs },
  tripCard: {
    width: 240,
    flexDirection: 'row',
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  tripCardImage: {
    width: 90,
    height: 110,
    borderTopRightRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  tripCardInfo: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  tripCardTitle: { ...typography.xs, fontWeight: typography.weights.semibold, lineHeight: 16 },
  tripCardMeta: { ...typography.xs },
  tripCardAuthor: { ...typography.xs },
  mapSection: {
    marginTop: spacing['2xl'],
    paddingHorizontal: spacing.xl,
  },
  mapSubtitle: { ...typography.caption, lineHeight: 18, marginBottom: spacing.smd },
  mapBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.smd,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  mapBtnText: { ...typography.sm, fontWeight: typography.weights.semibold },
  bottomSpacer: { height: spacing['2xl'] },
});
