import { Result } from '@shared/kernel';
import { AdminStats } from '../entities/AdminStats';
import { AdminUsersPage } from '../entities/AdminUsersPage';

export interface GetAdminStatsParams {
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
}

export interface GetAdminUsersParams {
  page: number;
  pageSize: number;
}

export interface AdminRepository {
  getStats(params: GetAdminStatsParams): Promise<Result<AdminStats>>;
  getUsers(params: GetAdminUsersParams): Promise<Result<AdminUsersPage>>;
  setUserActive(userId: string, isActive: boolean): Promise<Result<void>>;
}
