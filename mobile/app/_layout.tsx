import React, { type ReactNode } from 'react';
import { View, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  AuthProvider,
  AuthSessionProvider,
  useSession,
  type AuthExternalDependencies,
} from '@shared/auth';
import { ProfileProvider, useProfile, type ProfileExternalDependencies } from '@shared/profile';
import { TripProvider, type TripExternalDependencies } from '@shared/trips';
import { ItineraryProvider, type ItineraryExternalDependencies } from '@shared/itinerary';
import { AdminProvider, type AdminExternalDependencies } from '@shared/admin';
import { FollowProvider, type FollowExternalDependencies } from '@shared/follow';
import { createAuthRemoteDataSource } from '@/infrastructure/auth';
import { createProfileRemoteDataSource } from '@/infrastructure/profile';
import { createTripRemoteDataSource } from '@/infrastructure/trips';
import { createDoraRemoteDataSource } from '@/infrastructure/itinerary';
import { createAdminRemoteDataSource } from '@/infrastructure/admin';
import { createFollowRemoteDataSource } from '@/infrastructure/follow';
import { AppText, ErrorBoundary } from '@shared/ui-kit';

SplashScreen.preventAutoHideAsync();

// ─── Infrastructure singletons ───────────────────────────────────────────────

const _authDataSource = createAuthRemoteDataSource();
const authExternalDeps: AuthExternalDependencies = {
  authRemoteDataSource: _authDataSource,
};

const _profileDataSource = createProfileRemoteDataSource();
const profileExternalDeps: ProfileExternalDependencies = {
  profileRemoteDataSource: _profileDataSource,
};

const _tripDataSource = createTripRemoteDataSource();
const tripExternalDeps: TripExternalDependencies = {
  tripRemoteDataSource: _tripDataSource,
};

const _doraDataSource = createDoraRemoteDataSource();
const itineraryExternalDeps: ItineraryExternalDependencies = {
  doraRemoteDataSource: _doraDataSource,
};

const _adminDataSource = createAdminRemoteDataSource();
const adminExternalDeps: AdminExternalDependencies = {
  adminRemoteDataSource: _adminDataSource,
};

const _followDataSource = createFollowRemoteDataSource();
const followExternalDeps: FollowExternalDependencies = {
  followRemoteDataSource: _followDataSource,
};

// ─── Auth guard ──────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSession();
  const { profile, isLoading: profileLoading } = useProfile(session?.user.id);
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;

    const seg = segments as string[];
    const inAuth = seg[0] === 'auth';
    const inOnboarding = inAuth && seg[1] === 'onboarding';
    const inDeactivated = seg[0] === 'deactivated';

    if (!session) {
      if (!inAuth) router.replace('/auth');
      return;
    }

    if (!session.user.isOnboarded) {
      if (!inOnboarding) router.replace('/auth/onboarding/personal');
      return;
    }

    // Wait for profile before checking is_active
    if (profileLoading || profile === null) return;

    if (!profile.isActive) {
      if (!inDeactivated) router.replace('/deactivated');
      return;
    }

    if (inDeactivated) {
      router.replace('/(tabs)');
      return;
    }

    if (inAuth) router.replace('/(tabs)');
  }, [session, isLoading, profile, profileLoading, segments]);

  return <>{children}</>;
}

// ─── Splash view ──────────────────────────────────────────────────────────────

function SplashView() {
  return (
    <View style={splashStyles.container}>
      <AppText style={splashStyles.logo}>
        dora<AppText style={splashStyles.dot}>.</AppText>
      </AppText>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    paddingTop: 68,
  },
  logo: {
    fontSize: 64,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.32,
  },
  dot: {
    color: '#44FFFF',
  },
});

// ─── App content (requires session context) ───────────────────────────────────

function AppContent() {
  const { isLoading } = useSession();
  const [pastLoading, setPastLoading] = React.useState(false);
  const whiteCircleScale = React.useRef(new Animated.Value(0)).current;
  const cyanCircleScale = React.useRef(new Animated.Value(0)).current;
  const { width, height } = useWindowDimensions();
  const R = Math.ceil(Math.sqrt(width * width + height * height));

  React.useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  React.useEffect(() => {
    if (!isLoading && !pastLoading) {
      Animated.sequence([
        // White circle: fast 150ms transition
        Animated.timing(whiteCircleScale, {
          toValue: 1,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Cyan circle: 500ms
        Animated.timing(cyanCircleScale, {
          toValue: 1,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => {
        whiteCircleScale.setValue(0);
        cyanCircleScale.setValue(0);
        setPastLoading(true);
      });
    }
  }, [isLoading]);

  return (
    <>
      {pastLoading ? (
        <ProfileProvider dependencies={profileExternalDeps}>
          <TripProvider dependencies={tripExternalDeps}>
            <ItineraryProvider dependencies={itineraryExternalDeps}>
            <AdminProvider dependencies={adminExternalDeps}>
            <FollowProvider dependencies={followExternalDeps}>
            <AuthGuard>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#000000' },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="admin" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="deactivated" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </AuthGuard>
            </FollowProvider>
            </AdminProvider>
            </ItineraryProvider>
          </TripProvider>
        </ProfileProvider>
      ) : (
        <SplashView />
      )}
      {/* Transition circles: only rendered during splash animation */}
      {!pastLoading && (
        <>
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              backgroundColor: '#FFFFFF',
              width: R * 2,
              height: R * 2,
              borderRadius: R,
              left: width / 2 - R,
              top: height / 2 - R,
              transform: [{ scale: whiteCircleScale }],
            }}
          />
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              backgroundColor: '#44FFFF',
              width: R * 2,
              height: R * 2,
              borderRadius: R,
              left: width / 2 - R,
              top: height / 2 - R,
              opacity: 0.8,
              transform: [{ scale: cyanCircleScale }],
            }}
          />
        </>
      )}
    </>
  );
}

// ─── Root layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider dependencies={authExternalDeps}>
        <AuthSessionProvider>
          <AppContent />
        </AuthSessionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
