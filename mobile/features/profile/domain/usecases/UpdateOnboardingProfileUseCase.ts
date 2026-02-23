import { UseCase, Result, ID } from '@shared/kernel';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { OnboardingProfile } from '../entities/OnboardingProfile';

export interface UpdateOnboardingProfileParams {
  userId: ID;
  name: string;
  surname: string;
  email: string;
  pace: string;
  interests: string[];
  journaling: string;
  companionship: string;
}

export class UpdateOnboardingProfileUseCase
  implements UseCase<UpdateOnboardingProfileParams, void>
{
  constructor(private readonly repository: ProfileRepository) {}

  async execute(params: UpdateOnboardingProfileParams): Promise<Result<void>> {
    const profile: OnboardingProfile = {
      userId: params.userId,
      name: params.name.trim(),
      surname: params.surname.trim(),
      email: params.email.trim() || null,
      pace: params.pace || null,
      interests: params.interests,
      journaling: params.journaling || null,
      companionship: params.companionship || null,
    };
    return this.repository.saveOnboardingProfile(profile);
  }
}
