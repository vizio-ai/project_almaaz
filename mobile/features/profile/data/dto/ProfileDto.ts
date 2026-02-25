export interface UpdateOnboardingProfileDto {
  user_id: string;
  name: string;
  surname: string;
  email: string | null;
  pace: string | null;
  interests: string[];
  journaling: string | null;
  companionship: string | null;
}

export interface ProfileRowDto {
  id: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  role?: 'normal' | 'admin';
  is_active?: boolean;
  is_onboarded: boolean;
  pace: string | null;
  interests: string[];
  journaling: string | null;
  companionship: string | null;
  following_count: number;
  followers_count: number;
  trip_count: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileDto {
  user_id: string;
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
