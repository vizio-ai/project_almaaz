import { AuthRepositoryImpl } from '../AuthRepositoryImpl';
import { AuthRemoteDataSource } from '../../datasources/AuthRemoteDataSource';
import { OtpSessionDto } from '../../dto/OtpDto';

const mockSession: OtpSessionDto = {
  access_token: 'access-abc',
  refresh_token: 'refresh-xyz',
  expires_at: 1_700_000_000,
  user_id: 'user-1',
  phone: '+15551234567',
  is_onboarded: false,
};

const mockDataSource: AuthRemoteDataSource = {
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
  logout: jest.fn(),
  getCurrentSession: jest.fn(),
};

describe('AuthRepositoryImpl', () => {
  let repo: AuthRepositoryImpl;
  beforeEach(() => {
    jest.clearAllMocks();
    repo = new AuthRepositoryImpl(mockDataSource);
  });

  it('sendOtp returns ok on success', async () => {
    (mockDataSource.sendOtp as jest.Mock).mockResolvedValue(undefined);
    const result = await repo.sendOtp('+15551234567');
    expect(result.success).toBe(true);
  });

  it('sendOtp returns fail on network error', async () => {
    (mockDataSource.sendOtp as jest.Mock).mockRejectedValue(new Error('Network'));
    const result = await repo.sendOtp('+15551234567');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('NETWORK');
  });

  it('verifyOtp maps session to VerifyOtpData', async () => {
    (mockDataSource.verifyOtp as jest.Mock).mockResolvedValue(mockSession);
    const result = await repo.verifyOtp('+15551234567', '123456');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.user.id).toBe('user-1');
      expect(result.data.token.accessToken).toBe('access-abc');
    }
  });

  it('verifyOtp returns fail on error', async () => {
    (mockDataSource.verifyOtp as jest.Mock).mockRejectedValue(new Error('Invalid OTP'));
    const result = await repo.verifyOtp('+15551234567', '000000');
    expect(result.success).toBe(false);
  });

  it('getCurrentUser returns null when no session', async () => {
    (mockDataSource.getCurrentSession as jest.Mock).mockResolvedValue(null);
    const result = await repo.getCurrentUser();
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBeNull();
  });

  it('logout returns ok on success', async () => {
    (mockDataSource.logout as jest.Mock).mockResolvedValue(undefined);
    const result = await repo.logout();
    expect(result.success).toBe(true);
  });
});
