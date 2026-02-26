import { useState, useEffect, useCallback } from 'react';
import { useFollowDependencies } from '../../di/useFollowDependencies';

interface UseFollowResult {
  isFollowing: boolean;
  isLoading: boolean;
  toggleFollow: () => Promise<void>;
}

export function useFollow(
  currentUserId: string | undefined,
  targetUserId: string,
): UseFollowResult {
  const { followUserUseCase, unfollowUserUseCase, checkIsFollowingUseCase } =
    useFollowDependencies();

  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId || currentUserId === targetUserId) return;
    checkIsFollowingUseCase
      .execute({ followerId: currentUserId, followingId: targetUserId })
      .then(result => { if (result.success) setIsFollowing(result.data); });
  }, [currentUserId, targetUserId, checkIsFollowingUseCase]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || currentUserId === targetUserId) return;
    setIsLoading(true);
    if (isFollowing) {
      const result = await unfollowUserUseCase.execute({
        followerId: currentUserId,
        followingId: targetUserId,
      });
      if (result.success) setIsFollowing(false);
    } else {
      const result = await followUserUseCase.execute({
        followerId: currentUserId,
        followingId: targetUserId,
      });
      if (result.success) setIsFollowing(true);
    }
    setIsLoading(false);
  }, [currentUserId, targetUserId, isFollowing, followUserUseCase, unfollowUserUseCase]);

  return { isFollowing, isLoading, toggleFollow };
}
