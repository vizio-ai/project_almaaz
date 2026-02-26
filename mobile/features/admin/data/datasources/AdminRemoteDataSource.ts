import { AdminStatsDto, GetAdminUsersDto } from '../dto/AdminDto';

export interface AdminRemoteDataSource {
  getStats(startDate: string, endDate: string): Promise<AdminStatsDto>;
  getUsers(page: number, pageSize: number): Promise<GetAdminUsersDto>;
  setUserActive(userId: string, isActive: boolean): Promise<void>;
}
