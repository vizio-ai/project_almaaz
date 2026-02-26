import { UseCase, Result } from '@shared/kernel';
import { FollowRepository } from '../repositories/FollowRepository';

export interface FollowUserParams {
  followerId: string;
  followingId: string;
}

export class FollowUserUseCase implements UseCase<FollowUserParams, void> {
  constructor(private readonly repository: FollowRepository) {}

  execute(params: FollowUserParams): Promise<Result<void>> {
    return this.repository.followUser(params.followerId, params.followingId);
  }
}
