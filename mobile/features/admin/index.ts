// Domain
export type { AdminStats, DailyCount } from './domain/entities/AdminStats';
export type { AdminUser } from './domain/entities/AdminUser';
export type { AdminUsersPage } from './domain/entities/AdminUsersPage';
export type { AdminRepository } from './domain/repositories/AdminRepository';

// Data — DataSource interface (for infrastructure)
export type { AdminRemoteDataSource } from './data/datasources/AdminRemoteDataSource';
export type { AdminStatsDto, AdminUserRowDto, GetAdminUsersDto } from './data/dto/AdminDto';

// DI
export type { AdminExternalDependencies, AdminDependencies } from './di/AdminDependencies';
export { createAdminDependencies } from './di/AdminFactory';
export { AdminProvider } from './di/AdminProvider';
export { useAdminDependencies } from './di/useAdminDependencies';

// Presentation
export { useAdminDashboard } from './presentation/hooks/useAdminDashboard';
