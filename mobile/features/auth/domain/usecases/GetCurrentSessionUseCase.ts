import { UseCase, Result } from '@shared/kernel';
import { AuthRepository, VerifyOtpData } from '../repositories/AuthRepository';

/**
 * Restores the stored session on app launch.
 * Returns User + AuthToken together; token expiry is checked by the caller.
 */
export class GetCurrentSessionUseCase implements UseCase<void, VerifyOtpData | null> {
  constructor(private readonly repository: AuthRepository) {}

  async execute(): Promise<Result<VerifyOtpData | null>> {
    return this.repository.getCurrentSession();
  }
}
