import { useState, useEffect, useCallback } from 'react';
import { AdminStats } from '../../domain/entities/AdminStats';
import { AdminUser } from '../../domain/entities/AdminUser';
import { useAdminDependencies } from '../../di/useAdminDependencies';

const PAGE_SIZE = 10;

interface UseAdminDashboardResult {
  stats: AdminStats | null;
  users: AdminUser[];
  total: number;
  pageCount: number;
  currentPage: number;
  isLoadingStats: boolean;
  isLoadingUsers: boolean;
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

  useEffect(() => {
    let cancelled = false;
    setIsLoadingStats(true);
    getAdminStatsUseCase.execute().then(result => {
      if (cancelled) return;
      if (result.success) setStats(result.data);
      setIsLoadingStats(false);
    });
    return () => { cancelled = true; };
  }, [getAdminStatsUseCase]);

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

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const toggleUserActive = useCallback(
    async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const nextActive = !user.isActive;

      // Optimistic update
      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, isActive: nextActive } : u)),
      );

      const result = await setUserActiveUseCase.execute({
        userId,
        isActive: nextActive,
      });

      // Revert on failure
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
    goToPage,
    toggleUserActive,
  };
}
