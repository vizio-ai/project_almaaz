export interface DailyCount {
  date: string;  // 'YYYY-MM-DD'
  count: number;
}

export interface AdminStats {
  totalUsers: number;
  weeklyGain: number;
  dailyCounts: DailyCount[];  // last 7 days, oldest first
}
