import { useState, useCallback, useEffect, useRef } from 'react';
import { Profile } from '../../domain/entities/Profile';
import { useProfileDependencies } from '../../di/useProfileDependencies';

interface UseProfileResult {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;
  updateProfile: (params: {
    name: string;
    surname: string;
    email: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    pace: string | null;
    interests: string[];
    journaling: string | null;
    companionship: string | null;
  }) => Promise<boolean>;
  uploadAvatar: (fileUri: string) => Promise<string | null>;
}

export function useProfile(userId: string | undefined): UseProfileResult {
  const { getProfileUseCase, updateProfileUseCase, uploadAvatarUseCase } = useProfileDependencies();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProfileUseCaseRef = useRef(getProfileUseCase);
  getProfileUseCaseRef.current = getProfileUseCase;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    const result = await getProfileUseCaseRef.current.execute({ userId });
    if (result.success) {
      setProfile(result.data);
    } else {
      setError(formatErrorMessage(result.error.message));
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId, fetchProfile, formatErrorMessage]);

  const updateProfile = useCallback(
    async (params: {
      name: string;
      surname: string;
      email: string | null;
      username: string | null;
      avatar_url: string | null;
      bio: string | null;
      pace: string | null;
      interests: string[];
      journaling: string | null;
      companionship: string | null;
    }): Promise<boolean> => {
      if (!userId) return false;
      setIsLoading(true);
      setError(null);
      const result = await updateProfileUseCase.execute({ userId, ...params });
      setIsLoading(false);
      if (!result.success) {
        setError(formatErrorMessage(result.error.message));
        return false;
      }
      await fetchProfile();
      return true;
    },
    [userId, updateProfileUseCase, fetchProfile, formatErrorMessage],
  );

  const clearError = useCallback(() => setError(null), []);

  const formatErrorMessage = useCallback((msg: string): string => {
    const lower = msg.toLowerCase();
    if (lower.includes('network request failed')) {
      return 'Connection error. Please check your internet connection and try again.';
    }
    if (lower.includes('bucket') && (lower.includes('not found') || lower.includes('exist'))) {
      return 'Storage unavailable. Please try again later or contact support.';
    }
    return msg;
  }, []);

  const uploadAvatar = useCallback(
    async (fileUri: string): Promise<string | null> => {
      if (!userId) return null;
      const result = await uploadAvatarUseCase.execute({ userId, fileUri });
      if (!result.success) {
        setError(formatErrorMessage(result.error.message));
        return null;
      }
      setError(null);
      return result.data;
    },
    [userId, uploadAvatarUseCase, formatErrorMessage],
  );

  return { profile, isLoading, error, clearError, refresh: fetchProfile, updateProfile, uploadAvatar };
}
