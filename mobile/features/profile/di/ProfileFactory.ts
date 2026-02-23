import { ProfileRepositoryImpl } from '../data/repositories/ProfileRepositoryImpl';
import { GetProfileUseCase } from '../domain/usecases/GetProfileUseCase';
import { UpdateOnboardingProfileUseCase } from '../domain/usecases/UpdateOnboardingProfileUseCase';
import { UpdateProfileUseCase } from '../domain/usecases/UpdateProfileUseCase';
import { UploadAvatarUseCase } from '../domain/usecases/UploadAvatarUseCase';
import { ProfileExternalDependencies, ProfileDependencies } from './ProfileDependencies';

export function createProfileDependencies(
  external: ProfileExternalDependencies,
): ProfileDependencies {
  const repository = new ProfileRepositoryImpl(external.profileRemoteDataSource);

  return {
    getProfileUseCase: new GetProfileUseCase(repository),
    updateOnboardingProfileUseCase: new UpdateOnboardingProfileUseCase(repository),
    updateProfileUseCase: new UpdateProfileUseCase(repository),
    uploadAvatarUseCase: new UploadAvatarUseCase(repository),
  };
}
