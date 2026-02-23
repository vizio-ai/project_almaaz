import { UseCase, Result, ID } from '@shared/kernel';
import { ProfileRepository } from '../repositories/ProfileRepository';

export interface UploadAvatarParams {
  userId: ID;
  fileUri: string;
}

export class UploadAvatarUseCase implements UseCase<UploadAvatarParams, string> {
  constructor(private readonly repository: ProfileRepository) {}

  async execute(params: UploadAvatarParams): Promise<Result<string>> {
    return this.repository.uploadAvatar(params.userId, params.fileUri);
  }
}
