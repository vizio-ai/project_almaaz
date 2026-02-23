import { useState, useCallback } from 'react';
import { User } from '../../domain/entities/User';
import { AuthToken } from '../../domain/entities/AuthToken';
import { useAuthDependencies } from '../../di/useAuthDependencies';
import { resolveAuthError } from '../utils/errorMessages';

export interface AuthSession {
  user: User;
  token: AuthToken;
}

interface UseAuthResult {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  sendOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, code: string) => Promise<AuthSession | null>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
}

export function useAuth(): UseAuthResult {
  const { sendOtpUseCase, verifyOtpUseCase, logoutUseCase, getCurrentUserUseCase } =
    useAuthDependencies();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const sendOtp = useCallback(
    async (phone: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      const result = await sendOtpUseCase.execute({ phone });
      setIsLoading(false);
      if (!result.success) {
        setError(resolveAuthError(result.error.code, result.error.message));
        return false;
      }
      return true;
    },
    [sendOtpUseCase],
  );

  const verifyOtp = useCallback(
    async (phone: string, code: string): Promise<AuthSession | null> => {
      setIsLoading(true);
      setError(null);
      const result = await verifyOtpUseCase.execute({ phone, code });
      setIsLoading(false);
      if (!result.success) {
        setError(resolveAuthError(result.error.code, result.error.message));
        return null;
      }
      return result.data;
    },
    [verifyOtpUseCase],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    await logoutUseCase.execute();
    setIsLoading(false);
  }, [logoutUseCase]);

  const getCurrentUser = useCallback(async (): Promise<User | null> => {
    const result = await getCurrentUserUseCase.execute();
    if (!result.success) return null;
    return result.data;
  }, [getCurrentUserUseCase]);

  return { isLoading, error, clearError, sendOtp, verifyOtp, logout, getCurrentUser };
}
