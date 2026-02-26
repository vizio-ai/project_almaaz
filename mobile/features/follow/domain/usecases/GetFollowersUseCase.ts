import { UseCase, Result } from '@shared/kernel';
import { FollowRepository } from '../repositories/FollowRepository';
import { FollowUser } from '../entities/FollowUser';

export interface GetFollowersParams {
  userId: string;
}

export class GetFollowersUseCase implements UseCase<GetFollowersParams, FollowUser[]> {
  constructor(private readonly repository: FollowRepository) {}

  execute(params: GetFollowersParams): Promise<Result<FollowUser[]>> {
    return this.repository.getFollowers(params.userId);
  }
}
