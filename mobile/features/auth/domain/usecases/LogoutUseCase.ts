import { UseCase, Result } from '@shared/kernel';
import { AuthRepository } from '../repositories/AuthRepository';

export class LogoutUseCase implements UseCase<void, void> {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<Result<void>> {
    return this.authRepository.logout();
  }
}
