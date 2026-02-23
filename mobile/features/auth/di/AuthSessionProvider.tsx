import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthDependencies } from './useAuthDependencies';
import type { AuthSession } from '../presentation/hooks/useAuth';

const BOOTSTRAP_MIN_DELAY_MS = 2000;

SplashScreen.preventAutoHideAsync();

interface AuthSessionContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  setSession: (s: AuthSession | null) => void;
  markOnboarded: () => void;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function useSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (ctx == null) {
    throw new Error('useSession must be used within AuthSessionProvider');
  }
  return ctx;
}

interface AuthSessionProviderProps {
  children: ReactNode;
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const { getCurrentSessionUseCase } = useAuthDependencies();
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((s: AuthSession | null) => setSessionState(s), []);

  const markOnboarded = useCallback(() => {
    setSessionState((prev) =>
      prev ? { ...prev, user: { ...prev.user, isOnboarded: true } } : null,
    );
  }, []);

  const getCurrentSessionUseCaseRef = useRef(getCurrentSessionUseCase);
  getCurrentSessionUseCaseRef.current = getCurrentSessionUseCase;

  useEffect(() => {
    const minDelay = new Promise<void>((resolve) =>
      setTimeout(resolve, BOOTSTRAP_MIN_DELAY_MS),
    );

    Promise.all([
      getCurrentSessionUseCaseRef.current.execute(),
      minDelay,
    ])
      .then(([result]) => {
        if (result.success && result.data) {
          const { user, token } = result.data;
          const isExpired = token.expiresAt * 1000 < Date.now();
          if (!isExpired) {
            setSessionState({ user, token });
          }
        }
      })
      .catch(() => {
        // Session could not be loaded; stays null
      })
      .finally(() => {
        setIsLoading(false);
        SplashScreen.hideAsync();
      });
  }, []);

  const value: AuthSessionContextValue = {
    session,
    isLoading,
    setSession,
    markOnboarded,
  };

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}
