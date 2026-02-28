import { decode } from 'base64-arraybuffer';
import * as ImageManipulator from 'expo-image-manipulator';
import type {
  ProfileRemoteDataSource,
  UpdateOnboardingProfileDto,
  UpdateProfileDto,
  ProfileRowDto,
} from '@shared/profile';
import { supabase } from '../supabase';

/** Max avatar dimension; JPEG quality. Keeps storage small (~50–150KB vs 2–5MB). */
const AVATAR_MAX_SIZE = 512;
const AVATAR_JPEG_QUALITY = 0.8;

async function compressAvatarToBase64(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: AVATAR_MAX_SIZE } }],
    {
      compress: AVATAR_JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );
  if (!result.base64) throw new Error('Image compression failed');
  return result.base64;
}

function toPaceValue(label: string): string | null {
  const map: Record<string, string> = {
    'Planned & Fast': 'planned_fast',
    'Planned and Fast': 'planned_fast',
    'Balanced & Flexible': 'balanced',
    'Relaxed and Flexible': 'balanced',
    Spontaneous: 'spontaneous',
  };
  return map[label] ?? null;
}

function toJournalingValue(label: string): string | null {
  const map: Record<string, string> = {
    Storyteller: 'storyteller',
    Minimalist: 'minimalist',
    Photographer: 'photographer',
  };
  return map[label] ?? null;
}

function toCompanionshipValue(label: string): string | null {
  const map: Record<string, string> = {
    Solo: 'solo',
    Friends: 'friends',
    Family: 'family',
    Partner: 'partner',
  };
  return map[label] ?? null;
}

/** Convert interest labels to DB values (lowercase, underscores). */
function toInterestsValues(labels: string[]): string[] {
  const map: Record<string, string> = {
    Culture: 'culture',
    Food: 'food',
    'Photo Spots': 'photo_spots',
    Shopping: 'shopping',
    Nature: 'nature',
  };
  return (labels ?? []).map((l) => map[l] ?? String(l).toLowerCase().replace(/\s+/g, '_'));
}

const PROFILE_COLUMNS = [
  'id', 'name', 'surname', 'email', 'birthday', 'location', 'username', 'avatar_url', 'bio',
  'phone', 'role', 'is_active', 'is_onboarded', 'pace', 'interests', 'journaling',
  'companionship', 'following_count', 'followers_count', 'trip_count',
  'created_at', 'updated_at',
].join(', ');

export function createProfileRemoteDataSource(): ProfileRemoteDataSource {
  return {
    async getProfile(userId: string): Promise<ProfileRowDto> {
      const { data, error } = await supabase
        .from('profiles')
        .select(PROFILE_COLUMNS)
        .eq('id', userId)
        .single();

      if (error) throw new Error(error.message);
      return data as ProfileRowDto;
    },

    async updateOnboardingProfile(data: UpdateOnboardingProfileDto) {
      const { error } = await supabase
        .from('profiles')
        .upsert(
          {
            id:             data.user_id,
            name:           data.name,
            surname:        data.surname,
            email:          data.email,
            birthday:       data.birthday ?? null,
            location:       data.location ?? null,
            pace:           data.pace ? toPaceValue(data.pace) : null,
            interests:      toInterestsValues(data.interests ?? []),
            journaling:     data.journaling ? toJournalingValue(data.journaling) : null,
            companionship:  data.companionship ? toCompanionshipValue(data.companionship) : null,
            is_onboarded:   true,
          },
          { onConflict: 'id' },
        );

      if (error) throw new Error(error.message);
    },

    async updateProfile(data: UpdateProfileDto) {
      const { error } = await supabase
        .from('profiles')
        .update({
          name:           data.name,
          surname:        data.surname,
          email:          data.email,
          username:       data.username,
          avatar_url:     data.avatar_url ?? null,
          bio:            data.bio,
          pace:           data.pace ?? null,
          interests:      data.interests ?? [],
          journaling:     data.journaling ?? null,
          companionship:  data.companionship ?? null,
        })
        .eq('id', data.user_id);

      if (error) throw new Error(error.message);
    },

    async uploadAvatar(userId: string, fileUri: string): Promise<string> {
      const base64 = await compressAvatarToBase64(fileUri);
      const path = `${userId}/avatar.jpg`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, decode(base64), { contentType: 'image/jpeg', upsert: true });

      if (error) throw new Error(error.message);

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return data.publicUrl;
    },
  };
}
