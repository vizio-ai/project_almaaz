import { Result, ID } from '@shared/kernel';
import { OnboardingProfile } from '../entities/OnboardingProfile';
import { Profile } from '../entities/Profile';

export interface UpdateProfileData {
  userId: ID;
  name: string;
  surname: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  pace: string | null;
  interests: string[];
  journaling: string | null;
  companionship: string | null;
}

export interface ProfileRepository {
  getProfile(userId: ID): Promise<Result<Profile>>;
  saveOnboardingProfile(profile: OnboardingProfile): Promise<Result<void>>;
  updateProfile(data: UpdateProfileData): Promise<Result<void>>;
  uploadAvatar(userId: ID, fileUri: string): Promise<Result<string>>;
}
