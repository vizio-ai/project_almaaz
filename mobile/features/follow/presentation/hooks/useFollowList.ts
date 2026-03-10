import { useState, useEffect, useCallback } from 'react';
import { FollowUser } from '../../domain/entities/FollowUser';
import { useFollowDependencies } from '../../di/useFollowDependencies';

interface UseFollowListResult {
  users: FollowUser[];
  isLoading: boolean;
  refresh: () => void;
}

export function useFollowList(
  userId: string | undefined,
  type: 'followers' | 'following',
): UseFollowListResult {
  const { getFollowersUseCase, getFollowingUseCase } = useFollowDependencies();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const useCase = type === 'followers' ? getFollowersUseCase : getFollowingUseCase;
      const result = await useCase.execute({ userId });
      if (result.success) setUsers(result.data);
    } finally {
      setIsLoading(false);
    }
  }, [userId, type, getFollowersUseCase, getFollowingUseCase]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, isLoading, refresh: fetchUsers };
}
