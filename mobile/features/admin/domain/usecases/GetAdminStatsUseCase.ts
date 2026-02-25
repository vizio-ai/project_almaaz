import { UseCase, Result } from '@shared/kernel';
import { AdminRepository } from '../repositories/AdminRepository';
import { AdminStats } from '../entities/AdminStats';

export class GetAdminStatsUseCase implements UseCase<void, AdminStats> {
  constructor(private readonly repository: AdminRepository) {}

  execute(): Promise<Result<AdminStats>> {
    return this.repository.getStats();
  }
}
