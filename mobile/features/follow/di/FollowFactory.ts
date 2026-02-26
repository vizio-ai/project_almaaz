import { FollowRepositoryImpl } from '../data/repositories/FollowRepositoryImpl';
import { FollowUserUseCase } from '../domain/usecases/FollowUserUseCase';
import { UnfollowUserUseCase } from '../domain/usecases/UnfollowUserUseCase';
import { CheckIsFollowingUseCase } from '../domain/usecases/CheckIsFollowingUseCase';
import { GetFollowersUseCase } from '../domain/usecases/GetFollowersUseCase';
import { GetFollowingUseCase } from '../domain/usecases/GetFollowingUseCase';
import { FollowExternalDependencies, FollowDependencies } from './FollowDependencies';

export function createFollowDependencies(
  external: FollowExternalDependencies,
): FollowDependencies {
  const repository = new FollowRepositoryImpl(external.followRemoteDataSource);

  return {
    followUserUseCase: new FollowUserUseCase(repository),
    unfollowUserUseCase: new UnfollowUserUseCase(repository),
    checkIsFollowingUseCase: new CheckIsFollowingUseCase(repository),
    getFollowersUseCase: new GetFollowersUseCase(repository),
    getFollowingUseCase: new GetFollowingUseCase(repository),
  };
}
