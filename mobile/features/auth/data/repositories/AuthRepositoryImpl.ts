import { Result, ok, fail, networkError, timeoutError, appError } from '@shared/kernel';
import { AuthRepository, VerifyOtpData } from '../../domain/repositories/AuthRepository';
import { User } from '../../domain/entities/User';
import { AuthRemoteDataSource } from '../datasources/AuthRemoteDataSource';
import { AuthTokenMapper } from '../mappers/AuthTokenMapper';
import { UserMapper } from '../mappers/UserMapper';

function isNetworkOrTimeoutError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    if (error.name === 'AbortError') return true;
    const msg = error.message.toLowerCase();
    if (msg.includes('network request failed')) return true;
    if (msg.includes('failed to fetch')) return true;
    if (msg.includes('load failed')) return true;
  }
  return false;
}

function classifyError(error: unknown) {
  if (error instanceof Error && error.name === 'AbortError') {
    return fail(timeoutError(error));
  }
  if (isNetworkOrTimeoutError(error)) {
    return fail(networkError(error));
  }
  const msg = error instanceof Error ? error.message : String(error);
  return fail(appError('API_ERROR', msg, error));
}

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
      return classifyError(error);
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
      return classifyError(error);
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
