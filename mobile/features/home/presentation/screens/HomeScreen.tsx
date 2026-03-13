import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ImageBackground,
  type ImageSourcePropType,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession, TripCard } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { usePopularTrips, useHomeTrips } from '@shared/trips';
import { AppHeader, AppText, useThemeColor, typography, spacing, radii } from '@shared/ui-kit';
import type { PopularTrip } from '@shared/trips';

const FALLBACK_TRIPS: PopularTrip[] = [
  { id: '1', userId: '', title: 'A breath-taking journey on Tuscany', savedCount: 175, creatorName: 'Bethany', coverImageUrl: null },
  { id: '2', userId: '', title: 'Ancient temples of Kyoto', savedCount: 238, creatorName: 'Marcus', coverImageUrl: null },
  { id: '3', userId: '', title: 'Northern lights in Iceland', savedCount: 312, creatorName: 'Sofia', coverImageUrl: null },
];

export interface HomeScreenProps {
  heroImage: ImageSourcePropType;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return '';
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function HeroNoUpcoming({
  onPress,
  surfaceColor,
  textColor,
  borderColor,
}: {
  onPress: () => void;
  surfaceColor: string;
  textColor: string;
  borderColor: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.heroEmpty, { backgroundColor: surfaceColor, borderColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="add" size={28} color={textColor} />
      <AppText style={[styles.heroEmptyText, { color: textColor }]}>Start a new trip plan</AppText>
    </TouchableOpacity>
  );
}

function HeroUpcoming({
  title,
  startDate,
  endDate,
  coverImageUrl,
  itineraryId,
  heroImageFallback,
  buttonPrimary,
  buttonPrimaryText,
}: {
  title: string;
  startDate: string;
  endDate: string | null;
  coverImageUrl: string | null;
  itineraryId: string;
  heroImageFallback: ImageSourcePropType;
  buttonPrimary: string;
  buttonPrimaryText: string;
}) {
  const router = useRouter();
  const days = daysUntil(startDate);
  const imageSource = coverImageUrl ? { uri: coverImageUrl } : heroImageFallback;

  return (
    <ImageBackground
      source={imageSource}
      style={styles.heroCard}
      imageStyle={styles.heroCardImage}
      resizeMode="cover"
    >
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        <View style={styles.upcomingBadge}>
          <AppText style={styles.upcomingBadgeText}>
            Upcoming trip in {days} day{days !== 1 ? 's' : ''}
          </AppText>
        </View>
        <AppText style={[styles.heroTitle, { color: buttonPrimaryText }]} numberOfLines={2}>
          {title}
        </AppText>
        <AppText style={[styles.heroDate, { color: buttonPrimaryText }]}>
          {formatDateRange(startDate, endDate)}
        </AppText>
        <TouchableOpacity
          style={[styles.heroCta, { backgroundColor: buttonPrimaryText }]}
          onPress={() => router.push(`/itinerary/${itineraryId}` as const)}
          activeOpacity={0.85}
        >
          <AppText style={[styles.heroCtaText, { color: buttonPrimary }]}>View Itinerary</AppText>
          <Ionicons name="arrow-forward" size={14} color={buttonPrimary} />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const ACTIVITY_TYPE_ICON: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  park: 'leaf-outline',
  museum: 'business-outline',
  food: 'restaurant-outline',
  shopping: 'bag-outline',
  historic: 'compass-outline',
  beach: 'water-outline',
};

function HeroTodayPlan({
  itineraryId,
  accommodation,
  activities,
  surfaceColor,
  textColor,
  secondaryColor,
  buttonPrimary,
  buttonPrimaryText,
  borderColor,
}: {
  itineraryId: string;
  accommodation: string | null;
  activities: { id: string; name: string; activityType: string | null; startTime: string | null; locationText: string | null }[];
  surfaceColor: string;
  textColor: string;
  secondaryColor: string;
  buttonPrimary: string;
  buttonPrimaryText: string;
  borderColor: string;
}) {
  const router = useRouter();

  return (
    <View style={[styles.todayCard, { backgroundColor: surfaceColor, borderColor }]}>
      <AppText style={[styles.todayTitle, { color: textColor }]}>Today's Plan</AppText>

      {/* Accommodation row */}
      {accommodation ? (
        <View style={[styles.todaySubCard, styles.todaySubCardRow, { borderColor }]}>
          <Ionicons name="bed-outline" size={14} color={secondaryColor} style={styles.todaySubCardIcon} />
          <AppText style={[styles.todaySubCardText, { color: secondaryColor }]}>{accommodation}</AppText>
        </View>
      ) : null}

      {/* Activity rows */}
      {activities.slice(0, 3).map((act) => {
        const typeIcon = act.activityType
          ? (ACTIVITY_TYPE_ICON[act.activityType] ?? 'compass-outline')
          : null;
        return (
          <View key={act.id} style={[styles.todaySubCard, { borderColor }]}>
            <AppText style={[styles.todayActivityName, { color: textColor }]}>{act.name}</AppText>
            <View style={styles.todayMeta}>
              {typeIcon && act.activityType ? (
                <View style={styles.todayMetaItem}>
                  <Ionicons name={typeIcon} size={12} color={secondaryColor} />
                  <AppText style={[styles.todayMetaText, { color: secondaryColor }]}>{act.activityType}</AppText>
                </View>
              ) : null}
              {act.locationText ? (
                <View style={styles.todayMetaItem}>
                  <Ionicons name="location-outline" size={12} color={secondaryColor} />
                  <AppText style={[styles.todayMetaText, { color: secondaryColor }]}>{act.locationText}</AppText>
                </View>
              ) : null}
              {act.startTime ? (
                <View style={styles.todayMetaItem}>
                  <Ionicons name="time-outline" size={12} color={secondaryColor} />
                  <AppText style={[styles.todayMetaText, { color: secondaryColor }]}>{act.startTime}</AppText>
                </View>
              ) : null}
            </View>
          </View>
        );
      })}

      {activities.length === 0 && !accommodation && (
        <AppText style={[styles.todayEmpty, { color: secondaryColor }]}>
          No activities scheduled for today
        </AppText>
      )}

      <TouchableOpacity
        style={[styles.todayCta, { backgroundColor: buttonPrimary }]}
        onPress={() => router.push(`/itinerary/${itineraryId}` as const)}
        activeOpacity={0.85}
      >
        <AppText style={[styles.heroCtaText, { color: buttonPrimaryText }]}>See All Itinerary</AppText>
        <Ionicons name="arrow-forward" size={14} color={buttonPrimaryText} />
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────────

export function HomeScreen({ heroImage }: HomeScreenProps) {
  const { session } = useSession();
  const router = useRouter();
  const { profile } = useProfile(session?.user.id);
  const { trips } = usePopularTrips();
  const { activeTripToday, upcomingTrip, pastTripsCount } = useHomeTrips(session?.user.id);

  const headerBg = useThemeColor('headerBg');
  const surfaceAlt = useThemeColor('surfaceAlt');
  const surface = useThemeColor('surface');
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const accent = useThemeColor('accent');
  const buttonPrimary = useThemeColor('buttonPrimary');
  const buttonPrimaryText = useThemeColor('buttonPrimaryText');
  const borderColor = useThemeColor('border');

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

  // ── Hero: 3 states ─────────────────────────────────────────────────────────
  let heroContent: React.ReactNode;

  if (!isGuest && activeTripToday) {
    heroContent = (
      <HeroTodayPlan
        itineraryId={activeTripToday.id}
        accommodation={activeTripToday.todayAccommodation}
        activities={activeTripToday.todayActivities}
        surfaceColor={surface}
        textColor={text}
        secondaryColor={secondary}
        buttonPrimary={buttonPrimary}
        buttonPrimaryText={buttonPrimaryText}
        borderColor={borderColor}
      />
    );
  } else if (!isGuest && upcomingTrip) {
    heroContent = (
      <HeroUpcoming
        title={upcomingTrip.title}
        startDate={upcomingTrip.startDate!}
        endDate={upcomingTrip.endDate}
        coverImageUrl={upcomingTrip.coverImageUrl}
        itineraryId={upcomingTrip.id}
        heroImageFallback={heroImage}
        buttonPrimary={buttonPrimary}
        buttonPrimaryText={buttonPrimaryText}
      />
    );
  } else {
    heroContent = (
      <HeroNoUpcoming
        onPress={() => handleAuthOrAction(() => router.push('/create'))}
        surfaceColor={surface}
        textColor={text}
        borderColor={borderColor}
      />
    );
  }

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

        {/* Hero — dynamic 3 states */}
        <View style={styles.heroWrapper}>{heroContent}</View>

        {/* Past Trips pill */}
        {!isGuest && pastTripsCount > 0 && (
          <View style={styles.pastPillRow}>
            <TouchableOpacity
              style={[styles.pastPill, { backgroundColor: buttonPrimary }]}
              onPress={() => router.push('/my-trips')}
              activeOpacity={0.85}
            >
              <AppText style={[styles.pastPillText, { color: buttonPrimaryText }]}>
                {pastTripsCount} Past Trip{pastTripsCount !== 1 ? 's' : ''}
              </AppText>
              <Ionicons name="arrow-forward" size={14} color={buttonPrimaryText} />
            </TouchableOpacity>
          </View>
        )}

        {/* Popular Trips */}
        <AppText style={[styles.sectionTitle, { color: text, paddingHorizontal: spacing.xl }]}>
          Popular Trips
        </AppText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tripsRow}
        >
          {displayTrips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              width={160}
              onPress={() => handleAuthOrAction(() => router.push(`/itinerary/${trip.id}` as const))}
            />
          ))}
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
            onPress={() => handleAuthOrAction(() => router.push('/(tabs)/create?mode=import' as const))}
            activeOpacity={0.85}
          >
            <AppText style={[styles.mapBtnText, { color: buttonPrimaryText }]}>Import your trip plan  →</AppText>
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

  // Hero wrapper
  heroWrapper: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },

  // State 1 — No upcoming (dashed empty card)
  heroEmpty: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  heroEmptyText: { ...typography.sm, fontWeight: typography.weights.medium },

  // State 2 — Upcoming trip (image background)
  heroCard: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    height: 220,
    justifyContent: 'flex-end',
  },
  heroCardImage: { borderRadius: radii.xl },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radii.xl,
  },
  heroContent: { padding: spacing.lg },
  upcomingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  upcomingBadgeText: { ...typography.xs, color: '#FFFFFF', fontWeight: typography.weights.medium },
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

  // State 3 — Today's Plan card
  todayCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  todayTitle: {
    ...typography.base,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  // Sub-card for each row (accommodation + activities)
  todaySubCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.sm,
  },
  todaySubCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todaySubCardIcon: { marginRight: spacing.xs },
  todaySubCardText: { ...typography.sm, flex: 1 },
  todayActivityName: { ...typography.sm, fontWeight: typography.weights.semibold, marginBottom: 4 },
  todayMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.smd },
  todayMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  todayMetaText: { ...typography.xs },
  todayEmpty: { ...typography.sm, textAlign: 'center', paddingVertical: spacing.md },
  todayCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingVertical: spacing.smd,
    borderRadius: radii.full,
  },

  // Past Trips pill
  pastPillRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  pastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  pastPillText: { ...typography.caption, fontWeight: typography.weights.semibold },

  // Popular Trips
  sectionTitle: { ...typography.lg, fontWeight: typography.weights.bold, marginBottom: spacing.md },
  tripsRow: { gap: spacing.md, paddingHorizontal: spacing.xl, paddingRight: spacing.xl, paddingBottom: spacing.xs },

  // Fill Your Map
  mapSection: { marginTop: spacing['2xl'], paddingHorizontal: spacing.xl },
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
