import { Result } from '@shared/kernel';
import { FollowUser } from '../entities/FollowUser';

export interface FollowRepository {
  followUser(followerId: string, followingId: string): Promise<Result<void>>;
  unfollowUser(followerId: string, followingId: string): Promise<Result<void>>;
  checkIsFollowing(followerId: string, followingId: string): Promise<Result<boolean>>;
  getFollowers(userId: string): Promise<Result<FollowUser[]>>;
  getFollowing(userId: string): Promise<Result<FollowUser[]>>;
}
