import { Result } from '@shared/kernel';
import { User } from '../entities/User';
import { AuthToken } from '../entities/AuthToken';

export interface VerifyOtpData {
  token: AuthToken;
  user: User;
}

export interface AuthRepository {
  sendOtp(phone: string): Promise<Result<void>>;
  verifyOtp(phone: string, code: string): Promise<Result<VerifyOtpData>>;
  logout(): Promise<Result<void>>;
  /** Returns current session (token + user). Used for bootstrap. */
  getCurrentSession(): Promise<Result<VerifyOtpData | null>>;
  /** @deprecated Use getCurrentSession() outside of bootstrap */
  getCurrentUser(): Promise<Result<User | null>>;
}
