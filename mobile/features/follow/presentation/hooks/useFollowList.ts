import { useState, useEffect } from 'react';
import { FollowUser } from '../../domain/entities/FollowUser';
import { useFollowDependencies } from '../../di/useFollowDependencies';

interface UseFollowListResult {
  users: FollowUser[];
  isLoading: boolean;
}

export function useFollowList(
  userId: string | undefined,
  type: 'followers' | 'following',
): UseFollowListResult {
  const { getFollowersUseCase, getFollowingUseCase } = useFollowDependencies();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setIsLoading(true);
    const useCase = type === 'followers' ? getFollowersUseCase : getFollowingUseCase;
    useCase.execute({ userId }).then(result => {
      if (result.success) setUsers(result.data);
      setIsLoading(false);
    });
  }, [userId, type, getFollowersUseCase, getFollowingUseCase]);

  return { users, isLoading };
}
