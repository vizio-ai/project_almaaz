import { createAuthDependencies } from '../AuthFactory';
import { AuthRemoteDataSource } from '../../data/datasources/AuthRemoteDataSource';
import { SendOtpUseCase } from '../../domain/usecases/SendOtpUseCase';
import { VerifyOtpUseCase } from '../../domain/usecases/VerifyOtpUseCase';
import { LogoutUseCase } from '../../domain/usecases/LogoutUseCase';
import { GetCurrentUserUseCase } from '../../domain/usecases/GetCurrentUserUseCase';

const mockDataSource: AuthRemoteDataSource = {
  sendOtp: jest.fn(),
  verifyOtp: jest.fn(),
  logout: jest.fn(),
  getCurrentSession: jest.fn(),
};

describe('createAuthDependencies', () => {
  it('creates all use case instances', () => {
    const deps = createAuthDependencies({ authRemoteDataSource: mockDataSource });
    expect(deps.sendOtpUseCase).toBeInstanceOf(SendOtpUseCase);
    expect(deps.verifyOtpUseCase).toBeInstanceOf(VerifyOtpUseCase);
    expect(deps.logoutUseCase).toBeInstanceOf(LogoutUseCase);
    expect(deps.getCurrentUserUseCase).toBeInstanceOf(GetCurrentUserUseCase);
  });

  it('is a pure function — each call produces new instances', () => {
    const deps1 = createAuthDependencies({ authRemoteDataSource: mockDataSource });
    const deps2 = createAuthDependencies({ authRemoteDataSource: mockDataSource });
    expect(deps1.sendOtpUseCase).not.toBe(deps2.sendOtpUseCase);
  });
});
