import { Result, ok, fail, networkError } from '@shared/kernel';
import { FollowRepository } from '../../domain/repositories/FollowRepository';
import { FollowUser } from '../../domain/entities/FollowUser';
import { FollowRemoteDataSource } from '../datasources/FollowRemoteDataSource';
import { FollowUserDto } from '../dto/FollowDto';

function toFollowUser(dto: FollowUserDto): FollowUser {
  return {
    id: dto.id,
    name: dto.name,
    surname: dto.surname,
    avatarUrl: dto.avatar_url,
  };
}

export class FollowRepositoryImpl implements FollowRepository {
  constructor(private readonly remote: FollowRemoteDataSource) {}

  async followUser(followerId: string, followingId: string): Promise<Result<void>> {
    try {
      await this.remote.followUser(followerId, followingId);
      return ok(undefined);
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<Result<void>> {
    try {
      await this.remote.unfollowUser(followerId, followingId);
      return ok(undefined);
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async checkIsFollowing(followerId: string, followingId: string): Promise<Result<boolean>> {
    try {
      const result = await this.remote.checkIsFollowing(followerId, followingId);
      return ok(result);
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async getFollowers(userId: string): Promise<Result<FollowUser[]>> {
    try {
      const dtos = await this.remote.getFollowers(userId);
      return ok(dtos.map(toFollowUser));
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async getFollowing(userId: string): Promise<Result<FollowUser[]>> {
    try {
      const dtos = await this.remote.getFollowing(userId);
      return ok(dtos.map(toFollowUser));
    } catch (error) {
      return fail(networkError(error));
    }
  }
}
