export interface AdminStatsDto {
  total_users: number;
  weekly_gain: number;
  daily_counts: Array<{
    date: string;   // 'YYYY-MM-DD'
    count: number;
  }>;
}

export interface AdminUserRowDto {
  id: string;
  name: string | null;
  surname: string | null;
  created_at: string;
  is_active: boolean;
}

export interface GetAdminUsersDto {
  users: AdminUserRowDto[];
  total: number;
}
