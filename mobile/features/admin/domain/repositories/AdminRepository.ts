import { Result } from '@shared/kernel';
import { AdminStats } from '../entities/AdminStats';
import { AdminUsersPage } from '../entities/AdminUsersPage';

export interface GetAdminUsersParams {
  page: number;
  pageSize: number;
}

export interface AdminRepository {
  getStats(): Promise<Result<AdminStats>>;
  getUsers(params: GetAdminUsersParams): Promise<Result<AdminUsersPage>>;
  setUserActive(userId: string, isActive: boolean): Promise<Result<void>>;
}
