import { UseCase, Result, ID } from '@shared/kernel';
import { ProfileRepository } from '../repositories/ProfileRepository';

export interface UpdateProfileParams {
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

export class UpdateProfileUseCase implements UseCase<UpdateProfileParams, void> {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(params: UpdateProfileParams): Promise<Result<void>> {
    return this.repository.updateProfile({
      userId: params.userId,
      name: params.name.trim(),
      surname: params.surname.trim(),
      email: params.email?.trim() || null,
      username: params.username?.trim() || null,
      avatar_url: params.avatar_url ?? null,
      bio: params.bio?.trim() || null,
      pace: params.pace || null,
      interests: params.interests ?? [],
      journaling: params.journaling || null,
      companionship: params.companionship || null,
    });
  }
}
