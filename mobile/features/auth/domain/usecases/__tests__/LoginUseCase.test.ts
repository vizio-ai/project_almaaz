import { SendOtpUseCase } from '../SendOtpUseCase';
import { VerifyOtpUseCase } from '../VerifyOtpUseCase';
import { AuthRepository, VerifyOtpData } from '../../repositories/AuthRepository';
import { ok, fail, networkError } from '@shared/kernel';
import { AuthToken } from '../../entities/AuthToken';
import { User } from '../../entities/User';

const mockToken: AuthToken = {
  accessToken: 'access-123',
  refreshToken: 'refresh-456',
  expiresAt: Date.now() + 3_600_000,
};

const mockUser: User = { id: 'user-1', phone: '+15551234567', isOnboarded: false };
const mockData: VerifyOtpData = { token: mockToken, user: mockUser };

const mockRepository: AuthRepository = {
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
  getCurrentSession: jest.fn(),
};

describe('SendOtpUseCase', () => {
  const useCase = new SendOtpUseCase(mockRepository);
  beforeEach(() => jest.clearAllMocks());

  it('sends OTP for valid phone', async () => {
    (mockRepository.sendOtp as jest.Mock).mockResolvedValue(ok(undefined));
    const result = await useCase.execute({ phone: '+15551234567' });
    expect(result.success).toBe(true);
    expect(mockRepository.sendOtp).toHaveBeenCalledWith('+15551234567');
  });

  it('returns validation error for short phone', async () => {
    const result = await useCase.execute({ phone: '123' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('VALIDATION');
  });

  it('propagates repository error', async () => {
    (mockRepository.sendOtp as jest.Mock).mockResolvedValue(fail(networkError()));
    const result = await useCase.execute({ phone: '+15551234567' });
    expect(result.success).toBe(false);
  });
});

describe('VerifyOtpUseCase', () => {
  const useCase = new VerifyOtpUseCase(mockRepository);
  beforeEach(() => jest.clearAllMocks());

  it('verifies correct 6-digit code', async () => {
    (mockRepository.verifyOtp as jest.Mock).mockResolvedValue(ok(mockData));
    const result = await useCase.execute({ phone: '+15551234567', code: '123456' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.user.id).toBe('user-1');
  });

  it('returns validation error for wrong-length code', async () => {
    const result = await useCase.execute({ phone: '+15551234567', code: '12' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('VALIDATION');
  });
});
