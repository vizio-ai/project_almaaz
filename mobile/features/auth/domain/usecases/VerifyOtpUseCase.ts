import { UseCase, Result, validationError } from '@shared/kernel';
import { AuthRepository, VerifyOtpData } from '../repositories/AuthRepository';

export interface VerifyOtpParams {
  phone: string;
  code: string;
}

export class VerifyOtpUseCase implements UseCase<VerifyOtpParams, VerifyOtpData> {
  constructor(private readonly repository: AuthRepository) {}

  async execute(params: VerifyOtpParams): Promise<Result<VerifyOtpData>> {
    const { phone, code } = params;
    if (!code || code.length !== 6) {
      return { success: false, error: validationError('Please enter the 6-digit code') };
    }
    return this.repository.verifyOtp(phone, code);
  }
}
