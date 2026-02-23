import { AuthRepositoryImpl } from '../data/repositories/AuthRepositoryImpl';
import { SendOtpUseCase } from '../domain/usecases/SendOtpUseCase';
import { VerifyOtpUseCase } from '../domain/usecases/VerifyOtpUseCase';
import { LogoutUseCase } from '../domain/usecases/LogoutUseCase';
import { GetCurrentUserUseCase } from '../domain/usecases/GetCurrentUserUseCase';
import { GetCurrentSessionUseCase } from '../domain/usecases/GetCurrentSessionUseCase';
import { AuthExternalDependencies, AuthDependencies } from './AuthDependencies';

export function createAuthDependencies(
  external: AuthExternalDependencies,
): AuthDependencies {
  const repository = new AuthRepositoryImpl(external.authRemoteDataSource);

  return {
    sendOtpUseCase: new SendOtpUseCase(repository),
    verifyOtpUseCase: new VerifyOtpUseCase(repository),
    logoutUseCase: new LogoutUseCase(repository),
    getCurrentUserUseCase: new GetCurrentUserUseCase(repository),
    getCurrentSessionUseCase: new GetCurrentSessionUseCase(repository),
  };
}
