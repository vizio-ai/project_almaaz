import { Result, ok, fail, networkError, appError } from '@shared/kernel';
import { AuthRepository, VerifyOtpData } from '../../domain/repositories/AuthRepository';
import { User } from '../../domain/entities/User';
import { AuthRemoteDataSource } from '../datasources/AuthRemoteDataSource';
import { AuthTokenMapper } from '../mappers/AuthTokenMapper';
import { UserMapper } from '../mappers/UserMapper';

export class AuthRepositoryImpl implements AuthRepository {
  private readonly tokenMapper = new AuthTokenMapper();
  private readonly userMapper = new UserMapper();

  constructor(private readonly remoteDataSource: AuthRemoteDataSource) {}

  async sendOtp(phone: string): Promise<Result<void>> {
    try {
      await this.remoteDataSource.sendOtp({ phone });
      return ok(undefined);
    } catch (error) {
      console.error('[AuthRepository] sendOtp error:', error);
      if (error instanceof TypeError) return fail(networkError(error));
      const msg = error instanceof Error ? error.message : String(error);
      return fail(appError('API_ERROR', msg, error));
    }
  }

  async verifyOtp(phone: string, code: string): Promise<Result<VerifyOtpData>> {
    try {
      const session = await this.remoteDataSource.verifyOtp({ phone, token: code });
      return ok({
        token: this.tokenMapper.map(session),
        user: this.userMapper.map(session),
      });
    } catch (error) {
      console.error('[AuthRepository] verifyOtp error:', error);
      if (error instanceof TypeError) return fail(networkError(error));
      const msg = error instanceof Error ? error.message : String(error);
      return fail(appError('API_ERROR', msg, error));
    }
  }

  async logout(): Promise<Result<void>> {
    try {
      await this.remoteDataSource.logout();
      return ok(undefined);
    } catch (error) {
      return fail(networkError(error));
    }
  }

  async getCurrentSession(): Promise<Result<VerifyOtpData | null>> {
    try {
      const session = await this.remoteDataSource.getCurrentSession();
      if (!session) return ok(null);
      return ok({
        token: this.tokenMapper.map(session),
        user: this.userMapper.map(session),
      });
    } catch (error) {
      return fail(networkError(error));
    }
  }

  /** @deprecated Use getCurrentSession() outside of bootstrap */
  async getCurrentUser(): Promise<Result<User | null>> {
    try {
      const session = await this.remoteDataSource.getCurrentSession();
      if (!session) return ok(null);
      return ok(this.userMapper.map(session));
    } catch (error) {
      return fail(networkError(error));
    }
  }
}
