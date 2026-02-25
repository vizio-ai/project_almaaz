import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSession } from '@shared/auth';
import { useProfile } from '@shared/profile';
import { AppHeader, AppText, useThemeColor } from '@shared/ui-kit';

export default function HomeScreen() {
  const { session } = useSession();
  const router = useRouter();
  const { profile } = useProfile(session?.user.id);

  const headerBg = useThemeColor('headerBg');
  const bg = useThemeColor('background');
  const surfaceAlt = useThemeColor('surfaceAlt');
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const accent = useThemeColor('accent');
  const surface = useThemeColor('surface');

  const isGuest = !session;
  const firstName = profile?.name ?? null;

  return (
    <View style={[styles.root, { backgroundColor: surfaceAlt }]}>
      <StatusBar barStyle="light-content" backgroundColor={headerBg} />

      <AppHeader
        showAdminLabel={profile?.role === 'admin'}
        right={
          isGuest ? (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/auth')}
              activeOpacity={0.8}
            >
              <AppText style={styles.loginBtnText}>Login / Sign Up</AppText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={0.8}>
              <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isGuest && (
          <View style={[styles.guestBanner, { backgroundColor: 'rgba(0, 212, 212, 0.12)' }]}>
            <AppText style={[styles.guestBannerText, { color: text }]}>
              Create an account to meet your travel agent, plan with friends, and discover trips
            </AppText>
          </View>
        )}

        <AppText style={[styles.welcomeTitle, { color: text }]}>
          {isGuest ? 'Welcome Stranger' : `Welcome, ${firstName ?? 'Traveler'}`}
        </AppText>

        {/* Hero card */}
        <View style={[styles.heroCard, { overflow: 'hidden' }]}>
          <View style={styles.heroImagePlaceholder}>
            <View style={styles.heroOverlay}>
              <AppText style={styles.heroTitle}>Discover new places</AppText>
              <AppText style={styles.heroDate}>Start planning today</AppText>
              <TouchableOpacity
                style={[styles.heroBtn, { backgroundColor: surface }]}
                onPress={() => {
                  if (isGuest) router.push('/auth');
                }}
                activeOpacity={0.85}
              >
                <AppText style={[styles.heroBtnText, { color: text }]}>Start a new trip plan  →</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Your Map section */}
        <View style={[styles.mapSection, { backgroundColor: text }]}>
          <View style={styles.mapSectionInner}>
            <AppText style={[styles.mapTitle, { color: bg }]}>Your Map</AppText>
            <AppText style={[styles.mapSubtitle, { color: secondary }]}>
              Don't let memories fade. Build your digital footprint and keep your travel stories
              alive forever
            </AppText>
            <TouchableOpacity
              style={[styles.mapBtn, { backgroundColor: bg }]}
              onPress={() => (isGuest ? router.push('/auth') : null)}
              activeOpacity={0.85}
            >
              <AppText style={[styles.mapBtnText, { color: text }]}>Record a past trip  →</AppText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loginBtn: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  guestBanner: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  guestBannerText: { fontSize: 13, lineHeight: 20 },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  heroImagePlaceholder: {
    height: 200,
    backgroundColor: '#C8A882',
    justifyContent: 'flex-end',
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroOverlay: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  heroDate: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 12 },
  heroBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  heroBtnText: { fontSize: 13, fontWeight: '600' },
  mapSection: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapSectionInner: { padding: 20 },
  mapTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  mapSubtitle: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  mapBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  mapBtnText: { fontSize: 13, fontWeight: '600' },
  bottomSpacer: { height: 24 },
});
