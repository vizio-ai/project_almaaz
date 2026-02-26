import { FollowRemoteDataSource } from '../data/datasources/FollowRemoteDataSource';
import { FollowUserUseCase } from '../domain/usecases/FollowUserUseCase';
import { UnfollowUserUseCase } from '../domain/usecases/UnfollowUserUseCase';
import { CheckIsFollowingUseCase } from '../domain/usecases/CheckIsFollowingUseCase';
import { GetFollowersUseCase } from '../domain/usecases/GetFollowersUseCase';
import { GetFollowingUseCase } from '../domain/usecases/GetFollowingUseCase';

export interface FollowExternalDependencies {
  followRemoteDataSource: FollowRemoteDataSource;
}

export interface FollowDependencies {
  followUserUseCase: FollowUserUseCase;
  unfollowUserUseCase: UnfollowUserUseCase;
  checkIsFollowingUseCase: CheckIsFollowingUseCase;
  getFollowersUseCase: GetFollowersUseCase;
  getFollowingUseCase: GetFollowingUseCase;
}
