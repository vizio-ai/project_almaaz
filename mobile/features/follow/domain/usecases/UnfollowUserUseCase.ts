import { UseCase, Result } from '@shared/kernel';
import { FollowRepository } from '../repositories/FollowRepository';

export interface UnfollowUserParams {
  followerId: string;
  followingId: string;
}

export class UnfollowUserUseCase implements UseCase<UnfollowUserParams, void> {
  constructor(private readonly repository: FollowRepository) {}

  execute(params: UnfollowUserParams): Promise<Result<void>> {
    return this.repository.unfollowUser(params.followerId, params.followingId);
  }
}
