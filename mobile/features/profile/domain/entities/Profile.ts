import { ID } from '@shared/kernel';

export interface TravelPersona {
  pace: string | null;
  interests: string[];
  journaling: string | null;
  companionship: string | null;
}

export type ProfileRole = 'normal' | 'admin';

export interface Profile {
  id: ID;
  name: string | null;
  surname: string | null;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  role: ProfileRole;
  isOnboarded: boolean;
  isActive: boolean;
  persona: TravelPersona;
  followingCount: number;
  followersCount: number;
  tripCount: number;
  createdAt: string;
  updatedAt: string;
}
