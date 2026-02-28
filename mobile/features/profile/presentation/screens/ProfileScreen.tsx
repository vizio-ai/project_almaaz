import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, AppText, useThemeColor } from '@shared/ui-kit';
import { Profile } from '../../domain/entities/Profile';
import { ProfileActionButtons } from '../components/ProfileActionButtons';
import { ProfileHeader } from '../components/ProfileHeader';
import { FollowButton } from '../components/FollowButton';
import { ItinerariesGrid, PopularTrip } from '@shared/trips';

const PERSONA_LABELS: Record<string, Record<string, string>> = {
  pace: {
    planned_fast: 'Planned and fast',
    balanced: 'Relaxed and Flexible',
    spontaneous: 'Spontaneous',
  },
  journaling: {
    storyteller: 'Storyteller',
    minimalist: 'Minimalist',
    photographer: 'Photographer',
  },
  companionship: {
    solo: 'Solo',
    friends: 'Friends',
    family: 'Family',
    partner: 'Partner',
  },
  interests: {
    culture: 'Culture',
    food: 'Food',
    'photo spots': 'Photo Spots',
    'photo_spots': 'Photo Spots',
    places: 'Places & Spots',
    'places & spots': 'Places & Spots',
    shopping: 'Shopping',
    nature: 'Nature',
  },
};

const TAG_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'planned and fast': 'time-outline',
  'balanced & flexible': 'time-outline',
  'relaxed and flexible': 'time-outline',
  spontaneous: 'time-outline',
  storyteller: 'book-outline',
  minimalist: 'ellipse-outline',
  photographer: 'camera-outline',
  solo: 'person-outline',
  friends: 'people-outline',
  family: 'home-outline',
  partner: 'heart-outline',
  culture: 'library-outline',
  food: 'restaurant-outline',
  'photo spots': 'camera-outline',
  'photo_spots': 'camera-outline',
  'places & spots': 'location-outline',
  places: 'location-outline',
  shopping: 'bag-outline',
  nature: 'leaf-outline',
};

function getTagIcon(label: string): keyof typeof Ionicons.glyphMap {
  const key = label.toLowerCase();
  return TAG_ICONS[key] ?? 'ellipse-outline';
}

function buildDoraSummary(profile: Profile): string {
  const p = profile.persona;
  const hasData = p.pace || p.journaling || p.interests.length > 0 || p.companionship;
  if (!hasData) {
    return 'Dora is learning about your travel style. As you plan more trips, a personalized summary will appear here.';
  }
  const firstName = profile.name ?? 'They';
  const paceLabel = p.pace ? (PERSONA_LABELS.pace[p.pace] ?? p.pace) : '';
  const journalLabel = p.journaling ? (PERSONA_LABELS.journaling[p.journaling] ?? p.journaling) : '';
  const interestLabels = p.interests.map((i) => (PERSONA_LABELS.interests as Record<string, string>)[String(i).toLowerCase()] ?? i);
  const interestPart = interestLabels.length > 0 ? interestLabels.join(', ') : '';
  const companionshipLabel = p.companionship ? (PERSONA_LABELS.companionship[p.companionship] ?? p.companionship) : '';

  const parts: string[] = [];
  if (paceLabel) parts.push(`${firstName} is a dynamic traveler who thrives on a ${paceLabel} pace`);
  if (journalLabel) parts.push(`Defined by a ${journalLabel} persona`);
  if (interestPart) parts.push(`with a deep interest in ${interestPart}`);
  if (companionshipLabel) parts.push(`exploring alongside ${companionshipLabel}`);

  const intro = parts.filter(Boolean).join(', ');
  return `${intro}. Their extensive global footprint reflects a curated, social, and energetic approach to discovering the world.`;
}


interface ProfileScreenProps {
  profile: Profile | null;
  isLoading: boolean;
  isOwnProfile: boolean;
  onRefresh: () => Promise<void>;
  onEditPress: () => void;
  onSharePress?: () => void;
  onLogout: () => void;
  /** Shown only when isOwnProfile && profile.role === 'admin'. */
  onAdminDashboardPress?: () => void;
  /** Own profile: navigate to followers list. */
  onFollowersPress?: () => void;
  /** Own profile: navigate to following list. */
  onFollowingPress?: () => void;
  /** Other user profile: current follow state. */
  isFollowing?: boolean;
  isFollowLoading?: boolean;
  onFollowToggle?: () => void;
  /** Other user profile: their trips. */
  userTrips?: PopularTrip[];
  isTripsLoading?: boolean;
}

export function ProfileScreen({
  profile,
  isLoading,
  isOwnProfile,
  onRefresh,
  onEditPress,
  onSharePress,
  onLogout,
  onAdminDashboardPress,
  onFollowersPress,
  onFollowingPress,
  isFollowing,
  isFollowLoading,
  onFollowToggle,
  userTrips = [],
  isTripsLoading = false,
}: ProfileScreenProps) {
  const bg = useThemeColor('background');
  const text = useThemeColor('labelText');
  const subText = useThemeColor('subText');
  const secondary = useThemeColor('textSecondary');
  const border = useThemeColor('border');
  const accent = useThemeColor('accent');
  const surfaceAlt = useThemeColor('surfaceAlt');

  if (isLoading && !profile) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={[]}>
        <AppHeader variant="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={[]}>
        <AppHeader variant="dark" />
        <View style={styles.loadingContainer}>
          <AppText style={[styles.emptyText, { color: secondary }]}>Profile not found</AppText>
        </View>
      </SafeAreaView>
    );
  }

  const doraSummary = buildDoraSummary(profile);

  const personaTags: { label: string }[] = [];
  if (profile.persona.pace) {
    personaTags.push({ label: PERSONA_LABELS.pace[profile.persona.pace] ?? profile.persona.pace });
  }
  if (profile.persona.journaling) {
    personaTags.push({ label: PERSONA_LABELS.journaling[profile.persona.journaling] ?? profile.persona.journaling });
  }
  profile.persona.interests.forEach((i) => {
    const key = String(i).toLowerCase();
    personaTags.push({ label: (PERSONA_LABELS.interests as Record<string, string>)[key] ?? i });
  });
  if (profile.persona.companionship) {
    personaTags.push({ label: PERSONA_LABELS.companionship[profile.persona.companionship] ?? profile.persona.companionship });
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]} edges={[]}>
        <AppHeader variant="dark" showAdminLabel={profile.role === 'admin'} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={accent} />
        }
      >
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          onFollowingPress={onFollowingPress}
          onFollowersPress={onFollowersPress}
        />

        {!isOwnProfile && onFollowToggle && (
          <FollowButton
            isFollowing={isFollowing}
            isFollowLoading={isFollowLoading}
            onFollowToggle={onFollowToggle}
          />
        )}

        {!isOwnProfile && (
          <ItinerariesGrid trips={userTrips} isLoading={isTripsLoading} />
        )}

        {/* Edit Profile + Share Profile buttons */}
        {isOwnProfile && (
          <ProfileActionButtons onEditPress={onEditPress} onSharePress={onSharePress} />
        )}

        {/* Admin Dashboard — only for own profile and admin role */}
        {isOwnProfile && profile.role === 'admin' && onAdminDashboardPress && (
          <TouchableOpacity
            onPress={onAdminDashboardPress}
            activeOpacity={0.8}
            style={[styles.adminDashboardRow, { backgroundColor: surfaceAlt, borderColor: border }]}
          >
            <Ionicons name="grid-outline" size={20} color={accent} />
            <AppText style={[styles.adminDashboardLabel, { color: text }]}>Admin Dashboard</AppText>
            <Ionicons name="chevron-forward" size={18} color={secondary} />
          </TouchableOpacity>
        )}

        {/* Travel Style — own profile only */}
        {isOwnProfile && profile.isOnboarded && personaTags.length > 0 && (
          <View style={styles.section}>
            <AppText style={[styles.sectionTitle, { color: text }]}>Travel Style</AppText>
            <View style={styles.tagRow}>
              {personaTags.map(({ label }) => (
                <Tag key={label} label={label} />
              ))}
            </View>
          </View>
        )}

        {/* Summary by dora — own profile only */}
        {isOwnProfile && (
          <View style={styles.doraSummaryWrap}>
            <AppText style={[styles.doraSummaryTitle, { color: text }]}>Summary by dora.</AppText>
            <View style={styles.doraSummaryContent}>
              <AppText style={[styles.doraSummaryBody, { color: subText }]}>{doraSummary}</AppText>
            </View>
          </View>
        )}

        {/* My Footprint — own profile only */}
        {isOwnProfile && (
          <View style={[styles.mapPlaceholder, { backgroundColor: surfaceAlt, borderColor: border }]}>
            <AppText style={[styles.mapPlaceholderIcon, { color: accent }]}>🌍</AppText>
            <AppText style={[styles.mapPlaceholderTitle, { color: text }]}>My Footprint</AppText>
            <AppText style={[styles.mapPlaceholderBody, { color: secondary }]}>
              Your visited destinations will appear on the map as you complete trips.
            </AppText>
          </View>
        )}

        {/* Sign Out */}
        {isOwnProfile && (
          <TouchableOpacity onPress={onLogout} activeOpacity={0.8} style={styles.signOutWrap}>
            <AppText style={[styles.signOutText, { color: '#DC2626' }]}>Logout</AppText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Tag({ label }: { label: string }) {
  const iconName = getTagIcon(label);
  return (
    <View style={styles.tag}>
      <Ionicons name={iconName} size={14} color="#18181B" style={styles.tagIcon} />
      <AppText style={styles.tagText}>{label}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16 },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImg: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { fontSize: 26, fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '500', marginBottom: 16 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 1.5,
    elevation: 2,
  },
  tagIcon: { marginRight: 8 },
  tagText: { fontSize: 14, fontWeight: '500', color: '#18181B' },
  doraSummaryWrap: {
    marginBottom: 24,
  },
  doraSummaryTitle: { fontSize: 16, fontWeight: '500', marginBottom: 16 },
  doraSummaryContent: {},
  doraSummaryBody: { fontSize: 14, fontWeight: '400', color: '#737373', lineHeight: 22 },
  mapPlaceholder: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  mapPlaceholderIcon: { fontSize: 36, marginBottom: 10 },
  mapPlaceholderTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  mapPlaceholderBody: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  signOutWrap: { alignItems: 'center', paddingVertical: 16 },
  signOutText: { fontSize: 14, fontWeight: '500' },
  adminDashboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  adminDashboardLabel: { fontSize: 15, fontWeight: '500', marginLeft: 12, flex: 1 },
});
