import { Result, ok, fail, networkError } from '@shared/kernel';
import { AdminRepository, GetAdminUsersParams } from '../../domain/repositories/AdminRepository';
import { AdminStats } from '../../domain/entities/AdminStats';
import { AdminUsersPage } from '../../domain/entities/AdminUsersPage';
import { AdminUser } from '../../domain/entities/AdminUser';
import { AdminRemoteDataSource } from '../datasources/AdminRemoteDataSource';
import { AdminUserRowDto } from '../dto/AdminDto';

const DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const;

function formatJoined(isoDate: string): string {
  const d = new Date(isoDate);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function toAdminUser(dto: AdminUserRowDto): AdminUser {
  const firstName = dto.name ?? '';
  const lastInitial = dto.surname ? `${dto.surname.charAt(0).toUpperCase()}.` : '';
  return {
    id: dto.id,
    displayId: `#${dto.id.slice(0, 5).toUpperCase()}`,
    name: [firstName, lastInitial].filter(Boolean).join(' ') || 'Unknown',
    joined: formatJoined(dto.created_at),
    isActive: dto.is_active,
  };
}

export class AdminRepositoryImpl implements AdminRepository {
  constructor(private readonly remote: AdminRemoteDataSource) {}

  async getStats(): Promise<Result<AdminStats>> {
    try {
      const dto = await this.remote.getStats();
      return ok({
        totalUsers: Number(dto.total_users),
        weeklyGain: Number(dto.weekly_gain),
        dailyCounts: (dto.daily_counts ?? []).map(d => ({
          date: d.date,
          count: Number(d.count),
        })),
      });
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async getUsers(params: GetAdminUsersParams): Promise<Result<AdminUsersPage>> {
    try {
      const dto = await this.remote.getUsers(params.page, params.pageSize);
      return ok({
        users: dto.users.map(toAdminUser),
        total: dto.total,
        page: params.page,
        pageSize: params.pageSize,
      });
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async setUserActive(userId: string, isActive: boolean): Promise<Result<void>> {
    try {
      await this.remote.setUserActive(userId, isActive);
      return ok(undefined);
    } catch (error) {
      return fail(networkError(error));
    }
  }
}
