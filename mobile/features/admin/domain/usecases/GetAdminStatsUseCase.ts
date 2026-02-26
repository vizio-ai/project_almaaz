import { UseCase, Result } from '@shared/kernel';
import { AdminRepository, GetAdminStatsParams } from '../repositories/AdminRepository';
import { AdminStats } from '../entities/AdminStats';

export class GetAdminStatsUseCase implements UseCase<GetAdminStatsParams, AdminStats> {
  constructor(private readonly repository: AdminRepository) {}

  execute(params: GetAdminStatsParams): Promise<Result<AdminStats>> {
    return this.repository.getStats(params);
  }
}
