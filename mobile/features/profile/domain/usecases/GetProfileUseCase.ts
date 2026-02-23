import { UseCase, Result, ID } from '@shared/kernel';
import { ProfileRepository } from '../repositories/ProfileRepository';
import { Profile } from '../entities/Profile';

export interface GetProfileParams {
  userId: ID;
}

export class GetProfileUseCase implements UseCase<GetProfileParams, Profile> {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(params: GetProfileParams): Promise<Result<Profile>> {
    return this.repository.getProfile(params.userId);
  }
}
