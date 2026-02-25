import { UseCase, Result } from '@shared/kernel';
import { AdminRepository } from '../repositories/AdminRepository';

export interface SetUserActiveParams {
  userId: string;
  isActive: boolean;
}

export class SetUserActiveUseCase implements UseCase<SetUserActiveParams, void> {
  constructor(private readonly repository: AdminRepository) {}

  execute(params: SetUserActiveParams): Promise<Result<void>> {
    return this.repository.setUserActive(params.userId, params.isActive);
  }
}
