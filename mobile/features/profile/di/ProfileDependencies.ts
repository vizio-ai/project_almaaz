import { ProfileRemoteDataSource } from '../data/datasources/ProfileRemoteDataSource';
import { UpdateOnboardingProfileUseCase } from '../domain/usecases/UpdateOnboardingProfileUseCase';
import { GetProfileUseCase } from '../domain/usecases/GetProfileUseCase';
import { UpdateProfileUseCase } from '../domain/usecases/UpdateProfileUseCase';
import { UploadAvatarUseCase } from '../domain/usecases/UploadAvatarUseCase';

export interface ProfileExternalDependencies {
  profileRemoteDataSource: ProfileRemoteDataSource;
}

export interface ProfileDependencies {
  getProfileUseCase: GetProfileUseCase;
  updateOnboardingProfileUseCase: UpdateOnboardingProfileUseCase;
  updateProfileUseCase: UpdateProfileUseCase;
  uploadAvatarUseCase: UploadAvatarUseCase;
}
