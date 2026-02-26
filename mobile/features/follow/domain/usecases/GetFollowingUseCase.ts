import { UseCase, Result } from '@shared/kernel';
import { FollowRepository } from '../repositories/FollowRepository';
import { FollowUser } from '../entities/FollowUser';

export interface GetFollowingParams {
  userId: string;
}

export class GetFollowingUseCase implements UseCase<GetFollowingParams, FollowUser[]> {
  constructor(private readonly repository: FollowRepository) {}

  execute(params: GetFollowingParams): Promise<Result<FollowUser[]>> {
    return this.repository.getFollowing(params.userId);
  }
}
