import { UseCase, Result, fail, validationError } from '@shared/kernel';
import { AdminRepository } from '../repositories/AdminRepository';

export interface SetUserActiveParams {
  userId: string;
  isActive: boolean;
  currentUserId: string;
  targetRole: 'normal' | 'admin';
}

export class SetUserActiveUseCase implements UseCase<SetUserActiveParams, void> {
  constructor(private readonly repository: AdminRepository) {}

  async execute(params: SetUserActiveParams): Promise<Result<void>> {
    if (params.userId === params.currentUserId) {
      return fail(validationError('You cannot deactivate your own account.'));
    }
    if (params.targetRole === 'admin') {
      return fail(validationError('Admin accounts cannot be deactivated.'));
    }
    return this.repository.setUserActive(params.userId, params.isActive);
  }
}
