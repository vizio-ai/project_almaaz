import { UpdateOnboardingProfileDto, ProfileRowDto, UpdateProfileDto } from '../dto/ProfileDto';

export interface ProfileRemoteDataSource {
  getProfile(userId: string): Promise<ProfileRowDto>;
  updateOnboardingProfile(data: UpdateOnboardingProfileDto): Promise<void>;
  updateProfile(data: UpdateProfileDto): Promise<void>;
  uploadAvatar(userId: string, fileUri: string): Promise<string>;
  /** Subscribe to realtime changes on a profile row. Returns an unsubscribe function. */
  subscribeToProfileChanges(
    userId: string,
    onChanged: (dto: ProfileRowDto) => void,
  ): () => void;
}
