import React, { type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';

import {
  AuthProvider,
  AuthSessionProvider,
  useSession,
  type AuthExternalDependencies,
} from '@shared/auth';
import { ProfileProvider, type ProfileExternalDependencies } from '@shared/profile';
import { TripProvider, type TripExternalDependencies } from '@shared/trips';
import { createAuthRemoteDataSource } from '@/infrastructure/auth';
import { createProfileRemoteDataSource } from '@/infrastructure/profile';
import { createTripRemoteDataSource } from '@/infrastructure/trips';
import { AppText, ErrorBoundary } from '@shared/ui-kit';

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
      if (inAuth) router.replace('/(tabs)');
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
    paddingTop: 100,
  },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  dot: {
    color: '#44FFFF',
  },
});

// ─── App content (requires session context) ───────────────────────────────────

function AppContent() {
  const { isLoading } = useSession();

  if (isLoading) return <SplashView />;

  return (
    <ProfileProvider dependencies={profileExternalDeps}>
      <TripProvider dependencies={tripExternalDeps}>
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
      </TripProvider>
    </ProfileProvider>
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
