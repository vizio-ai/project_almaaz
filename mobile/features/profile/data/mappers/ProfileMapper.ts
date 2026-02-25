import { Mapper } from '@shared/kernel';
import { ProfileRowDto } from '../dto/ProfileDto';
import { Profile } from '../../domain/entities/Profile';

/** Normalize interest value from DB (handles "Culture" or "culture", "Photo Spots" or "photo_spots"). */
function normalizeInterest(v: unknown): string {
  const s = String(v ?? '').trim();
  if (!s) return '';
  return s.toLowerCase().replace(/\s+/g, '_');
}

export class ProfileMapper implements Mapper<ProfileRowDto, Profile> {
  map(dto: ProfileRowDto): Profile {
    const rawInterests = dto.interests ?? [];
    const interests = Array.isArray(rawInterests)
      ? rawInterests.map(normalizeInterest).filter(Boolean)
      : [];

    return {
      id: dto.id,
      name: dto.name,
      surname: dto.surname,
      email: dto.email,
      username: dto.username,
      avatarUrl: dto.avatar_url,
      bio: dto.bio,
      phone: dto.phone,
      role: dto.role === 'admin' ? 'admin' : 'normal',
      isOnboarded: dto.is_onboarded,
      isActive: dto.is_active ?? true,
      persona: {
        pace: dto.pace ?? null,
        interests,
        journaling: dto.journaling ?? null,
        companionship: dto.companionship ?? null,
      },
      followingCount: dto.following_count,
      followersCount: dto.followers_count,
      tripCount: dto.trip_count,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
    };
  }
}
