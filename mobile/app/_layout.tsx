import React, { type ReactNode } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {
  AuthProvider,
  AuthSessionProvider,
  useSession,
  type AuthExternalDependencies,
} from '@shared/auth';
import { ProfileProvider, type ProfileExternalDependencies } from '@shared/profile';
import { TripProvider, type TripExternalDependencies } from '@shared/trips';
import { ItineraryProvider, type ItineraryExternalDependencies } from '@shared/itinerary';
import { createAuthRemoteDataSource } from '@/infrastructure/auth';
import { createProfileRemoteDataSource } from '@/infrastructure/profile';
import { createTripRemoteDataSource } from '@/infrastructure/trips';
import { createDoraRemoteDataSource } from '@/infrastructure/itinerary';
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

// ─── Auth guard ──────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;

    const seg = segments as string[];
    const inAuth = seg[0] === 'auth';
    const inOnboarding = inAuth && seg[1] === 'onboarding';

    if (!session) {
      if (!inAuth) router.replace('/auth');
    } else if (!session.user.isOnboarded) {
      if (!inOnboarding) router.replace('/auth/onboarding/personal');
    } else {
      if (inAuth) router.replace(inOnboarding ? '/(tabs)/create' : '/(tabs)');
    }
  }, [session, isLoading, segments]);

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
        // Beyaz daire ekran ortasından açılır (400ms)
        Animated.timing(whiteCircleScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Beyaz 1 saniye görünür
        Animated.delay(1000),
        // Cyan daire orta üstten gelip ekranı kaplar (500ms)
        Animated.timing(cyanCircleScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setPastLoading(true);
        // Navigation settle olsun, sonra overlay'leri kaldır
        setTimeout(() => {
          whiteCircleScale.setValue(0);
          cyanCircleScale.setValue(0);
        }, 350);
      });
    }
  }, [isLoading]);

  return (
    <>
      {pastLoading ? (
        <ProfileProvider dependencies={profileExternalDeps}>
          <TripProvider dependencies={tripExternalDeps}>
            <ItineraryProvider dependencies={itineraryExternalDeps}>
            <AuthGuard>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: '#000000' },
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
                <Stack.Screen name="+not-found" />
              </Stack>
            </AuthGuard>
            </ItineraryProvider>
          </TripProvider>
        </ProfileProvider>
      ) : (
        <SplashView />
      )}
      {/* Beyaz daire: ekran ortasından açılır */}
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
      {/* Cyan daire: orta üstten gelir */}
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
