import { AuthRemoteDataSource } from '../data/datasources/AuthRemoteDataSource';
import { SendOtpUseCase } from '../domain/usecases/SendOtpUseCase';
import { VerifyOtpUseCase } from '../domain/usecases/VerifyOtpUseCase';
import { LogoutUseCase } from '../domain/usecases/LogoutUseCase';
import { GetCurrentUserUseCase } from '../domain/usecases/GetCurrentUserUseCase';
import { GetCurrentSessionUseCase } from '../domain/usecases/GetCurrentSessionUseCase';

export interface AuthExternalDependencies {
  authRemoteDataSource: AuthRemoteDataSource;
}

export interface AuthDependencies {
  sendOtpUseCase: SendOtpUseCase;
  verifyOtpUseCase: VerifyOtpUseCase;
  logoutUseCase: LogoutUseCase;
  getCurrentUserUseCase: GetCurrentUserUseCase;
  getCurrentSessionUseCase: GetCurrentSessionUseCase;
}
