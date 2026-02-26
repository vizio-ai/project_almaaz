// Domain
export type { FollowUser } from './domain/entities/FollowUser';
export type { FollowRepository } from './domain/repositories/FollowRepository';

// Data — DataSource interface (for infrastructure)
export type { FollowRemoteDataSource } from './data/datasources/FollowRemoteDataSource';
export type { FollowUserDto } from './data/dto/FollowDto';

// DI
export type { FollowExternalDependencies, FollowDependencies } from './di/FollowDependencies';
export { createFollowDependencies } from './di/FollowFactory';
export { FollowProvider } from './di/FollowProvider';
export { useFollowDependencies } from './di/useFollowDependencies';

// Presentation
export { useFollow } from './presentation/hooks/useFollow';
export { useFollowList } from './presentation/hooks/useFollowList';
export { FollowListScreen } from './presentation/screens/FollowListScreen';
