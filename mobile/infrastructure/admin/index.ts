import type {
  AdminRemoteDataSource,
  AdminStatsDto,
  GetAdminUsersDto,
} from '@shared/admin';
import { supabase } from '../supabase';

export function createAdminRemoteDataSource(): AdminRemoteDataSource {
  return {
    async getStats(startDate: string, endDate: string): Promise<AdminStatsDto> {
      const { data, error } = await supabase.rpc('get_admin_stats', {
        p_start_date: startDate,
        p_end_date: endDate,
      });
      if (error) throw new Error(error.message);
      return data as AdminStatsDto;
    },

    async getUsers(page: number, pageSize: number): Promise<GetAdminUsersDto> {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await supabase
        .from('profiles')
        .select('id, name, surname, created_at, is_active', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);

      return {
        users: (data ?? []) as GetAdminUsersDto['users'],
        total: count ?? 0,
      };
    },

    async setUserActive(userId: string, isActive: boolean): Promise<void> {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw new Error(error.message);
    },
  };
}
