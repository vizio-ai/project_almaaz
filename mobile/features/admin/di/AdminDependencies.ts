import { AdminRemoteDataSource } from '../data/datasources/AdminRemoteDataSource';
import { GetAdminStatsUseCase } from '../domain/usecases/GetAdminStatsUseCase';
import { GetAdminUsersUseCase } from '../domain/usecases/GetAdminUsersUseCase';
import { SetUserActiveUseCase } from '../domain/usecases/SetUserActiveUseCase';

export interface AdminExternalDependencies {
  adminRemoteDataSource: AdminRemoteDataSource;
}

export interface AdminDependencies {
  getAdminStatsUseCase: GetAdminStatsUseCase;
  getAdminUsersUseCase: GetAdminUsersUseCase;
  setUserActiveUseCase: SetUserActiveUseCase;
}
