import { Result, ok, fail, networkError } from '@shared/kernel';
import type { ID } from '@shared/kernel';
import { ProfileRepository, UpdateProfileData } from '../../domain/repositories/ProfileRepository';
import { OnboardingProfile } from '../../domain/entities/OnboardingProfile';
import { Profile } from '../../domain/entities/Profile';
import { ProfileRemoteDataSource } from '../datasources/ProfileRemoteDataSource';
import { ProfileMapper } from '../mappers/ProfileMapper';

export class ProfileRepositoryImpl implements ProfileRepository {
  private readonly mapper = new ProfileMapper();

  constructor(private readonly remoteDataSource: ProfileRemoteDataSource) {}

  async getProfile(userId: string): Promise<Result<Profile>> {
    try {
      const dto = await this.remoteDataSource.getProfile(userId);
      return ok(this.mapper.map(dto));
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async saveOnboardingProfile(profile: OnboardingProfile): Promise<Result<void>> {
    try {
      await this.remoteDataSource.updateOnboardingProfile({
        user_id:       profile.userId,
        name:          profile.name,
        surname:       profile.surname,
        email:         profile.email,
        pace:          profile.pace,
        interests:     profile.interests,
        journaling:    profile.journaling,
        companionship: profile.companionship,
      });
      return ok(undefined);
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async updateProfile(data: UpdateProfileData): Promise<Result<void>> {
    try {
      await this.remoteDataSource.updateProfile({
        user_id:       data.userId,
        name:          data.name,
        surname:       data.surname,
        email:         data.email,
        username:      data.username,
        avatar_url:    data.avatar_url,
        bio:           data.bio,
        pace:          data.pace,
        interests:     data.interests,
        journaling:    data.journaling,
        companionship: data.companionship,
      });
      return ok(undefined);
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async uploadAvatar(userId: ID, fileUri: string): Promise<Result<string>> {
    try {
      const url = await this.remoteDataSource.uploadAvatar(String(userId), fileUri);
      return ok(url);
    } catch (error) {
      return fail(networkError(error));
    }
  }
}
