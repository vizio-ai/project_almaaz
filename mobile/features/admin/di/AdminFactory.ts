import { AdminRepositoryImpl } from '../data/repositories/AdminRepositoryImpl';
import { GetAdminStatsUseCase } from '../domain/usecases/GetAdminStatsUseCase';
import { GetAdminUsersUseCase } from '../domain/usecases/GetAdminUsersUseCase';
import { SetUserActiveUseCase } from '../domain/usecases/SetUserActiveUseCase';
import { AdminExternalDependencies, AdminDependencies } from './AdminDependencies';

export function createAdminDependencies(
  external: AdminExternalDependencies,
): AdminDependencies {
  const repository = new AdminRepositoryImpl(external.adminRemoteDataSource);

  return {
    getAdminStatsUseCase: new GetAdminStatsUseCase(repository),
    getAdminUsersUseCase: new GetAdminUsersUseCase(repository),
    setUserActiveUseCase: new SetUserActiveUseCase(repository),
  };
}
