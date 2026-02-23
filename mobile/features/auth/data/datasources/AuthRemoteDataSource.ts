import { SendOtpRequestDto, VerifyOtpRequestDto, OtpSessionDto } from '../dto/OtpDto';

export interface AuthRemoteDataSource {
  sendOtp(request: SendOtpRequestDto): Promise<void>;
  verifyOtp(request: VerifyOtpRequestDto): Promise<OtpSessionDto>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<OtpSessionDto | null>;
}
