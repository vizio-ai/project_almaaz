import { UseCase, Result } from '@shared/kernel';
import { AuthRepository } from '../repositories/AuthRepository';
import { User } from '../entities/User';

export class GetCurrentUserUseCase implements UseCase<void, User | null> {
  constructor(private readonly repository: AuthRepository) {}

  async execute(): Promise<Result<User | null>> {
    return this.repository.getCurrentUser();
  }
}
