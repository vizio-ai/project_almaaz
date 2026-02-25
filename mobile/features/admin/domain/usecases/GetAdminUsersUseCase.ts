import { UseCase, Result } from '@shared/kernel';
import { AdminRepository, GetAdminUsersParams } from '../repositories/AdminRepository';
import { AdminUsersPage } from '../entities/AdminUsersPage';

export class GetAdminUsersUseCase implements UseCase<GetAdminUsersParams, AdminUsersPage> {
  constructor(private readonly repository: AdminRepository) {}

  execute(params: GetAdminUsersParams): Promise<Result<AdminUsersPage>> {
    return this.repository.getUsers(params);
  }
}
