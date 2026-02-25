import { AdminStatsDto, GetAdminUsersDto } from '../dto/AdminDto';

export interface AdminRemoteDataSource {
  getStats(): Promise<AdminStatsDto>;
  getUsers(page: number, pageSize: number): Promise<GetAdminUsersDto>;
  setUserActive(userId: string, isActive: boolean): Promise<void>;
}
