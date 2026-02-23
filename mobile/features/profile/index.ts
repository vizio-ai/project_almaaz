// Domain — Entities
export type { OnboardingProfile } from './domain/entities/OnboardingProfile';
export type { Profile, TravelPersona } from './domain/entities/Profile';

// Domain — Repository
export type { ProfileRepository, UpdateProfileData } from './domain/repositories/ProfileRepository';

// Domain — Use Cases
export { UpdateOnboardingProfileUseCase } from './domain/usecases/UpdateOnboardingProfileUseCase';
export type { UpdateOnboardingProfileParams } from './domain/usecases/UpdateOnboardingProfileUseCase';
export { GetProfileUseCase } from './domain/usecases/GetProfileUseCase';
export type { GetProfileParams } from './domain/usecases/GetProfileUseCase';
export { UpdateProfileUseCase } from './domain/usecases/UpdateProfileUseCase';
export type { UpdateProfileParams } from './domain/usecases/UpdateProfileUseCase';

// Data — DTO (for infrastructure)
export type { UpdateOnboardingProfileDto, ProfileRowDto, UpdateProfileDto } from './data/dto/ProfileDto';

// Data — DataSource interface
export type { ProfileRemoteDataSource } from './data/datasources/ProfileRemoteDataSource';

// Data — Repository implementation
export { ProfileRepositoryImpl } from './data/repositories/ProfileRepositoryImpl';

// Data — Mapper
export { ProfileMapper } from './data/mappers/ProfileMapper';

// DI
export type { ProfileExternalDependencies, ProfileDependencies } from './di/ProfileDependencies';
export { createProfileDependencies } from './di/ProfileFactory';
export { ProfileProvider } from './di/ProfileProvider';
export { useProfileDependencies } from './di/useProfileDependencies';

// Presentation
export { useProfile } from './presentation/hooks/useProfile';
export { ProfileScreen } from './presentation/screens/ProfileScreen';
export { EditProfileScreen } from './presentation/screens/EditProfileScreen';
