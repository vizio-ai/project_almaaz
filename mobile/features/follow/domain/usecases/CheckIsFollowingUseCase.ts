import { UseCase, Result } from '@shared/kernel';
import { FollowRepository } from '../repositories/FollowRepository';

export interface CheckIsFollowingParams {
  followerId: string;
  followingId: string;
}

export class CheckIsFollowingUseCase implements UseCase<CheckIsFollowingParams, boolean> {
  constructor(private readonly repository: FollowRepository) {}

  execute(params: CheckIsFollowingParams): Promise<Result<boolean>> {
    return this.repository.checkIsFollowing(params.followerId, params.followingId);
  }
}
