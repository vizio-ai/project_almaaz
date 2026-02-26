import { useState, useEffect, useCallback } from 'react';
import { AdminStats } from '../../domain/entities/AdminStats';
import { AdminUser } from '../../domain/entities/AdminUser';
import { useAdminDependencies } from '../../di/useAdminDependencies';

const PAGE_SIZE = 10;

export interface DateRange {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
}

function defaultRange(): DateRange {
  const now = new Date();
  const start = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  };
}

export function formatRangeLabel(range: DateRange): string {
  const fmt = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${day}.${m}.${y}`;
  };
  return `${fmt(range.startDate)} – ${fmt(range.endDate)}`;
}

interface UseAdminDashboardResult {
  stats: AdminStats | null;
  users: AdminUser[];
  total: number;
  pageCount: number;
  currentPage: number;
  isLoadingStats: boolean;
  isLoadingUsers: boolean;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  goToPage: (page: number) => void;
  toggleUserActive: (userId: string) => Promise<void>;
}

export function useAdminDashboard(): UseAdminDashboardResult {
  const { getAdminStatsUseCase, getAdminUsersUseCase, setUserActiveUseCase } =
    useAdminDependencies();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [dateRange, setDateRangeState] = useState<DateRange>(defaultRange);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingStats(true);
    getAdminStatsUseCase
      .execute({
        startDate: new Date(dateRange.startDate).toISOString(),
        endDate: new Date(dateRange.endDate + 'T23:59:59').toISOString(),
      })
      .then(result => {
        if (cancelled) return;
        if (result.success) setStats(result.data);
        setIsLoadingStats(false);
      });
    return () => { cancelled = true; };
  }, [getAdminStatsUseCase, dateRange.startDate, dateRange.endDate]);

  const fetchUsers = useCallback(
    (page: number) => {
      setIsLoadingUsers(true);
      getAdminUsersUseCase
        .execute({ page, pageSize: PAGE_SIZE })
        .then(result => {
          if (result.success) {
            setUsers(result.data.users);
            setTotal(result.data.total);
          }
          setIsLoadingUsers(false);
        });
    },
    [getAdminUsersUseCase],
  );

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage, fetchUsers]);

  const goToPage = useCallback((page: number) => setCurrentPage(page), []);

  const setDateRange = useCallback((range: DateRange) => {
    setDateRangeState(range);
    setCurrentPage(1);
  }, []);

  const toggleUserActive = useCallback(
    async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const nextActive = !user.isActive;

      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, isActive: nextActive } : u)),
      );

      const result = await setUserActiveUseCase.execute({ userId, isActive: nextActive });

      if (!result.success) {
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, isActive: user.isActive } : u)),
        );
      }
    },
    [users, setUserActiveUseCase],
  );

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    stats,
    users,
    total,
    pageCount,
    currentPage,
    isLoadingStats,
    isLoadingUsers,
    dateRange,
    setDateRange,
    goToPage,
    toggleUserActive,
  };
}
