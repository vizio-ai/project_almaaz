import { FollowUserDto } from '../dto/FollowDto';

export interface FollowRemoteDataSource {
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  checkIsFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string): Promise<FollowUserDto[]>;
  getFollowing(userId: string): Promise<FollowUserDto[]>;
}
