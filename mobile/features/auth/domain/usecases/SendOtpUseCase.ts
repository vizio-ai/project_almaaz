import { UseCase, Result, validationError } from '@shared/kernel';
import { AuthRepository } from '../repositories/AuthRepository';

export interface SendOtpParams {
  phone: string;
}

export class SendOtpUseCase implements UseCase<SendOtpParams, void> {
  constructor(private readonly repository: AuthRepository) {}

  async execute(params: SendOtpParams): Promise<Result<void>> {
    const phone = params.phone.trim();
    if (phone.length < 6) {
      return { success: false, error: validationError('Please enter a valid phone number') };
    }
    return this.repository.sendOtp(phone);
  }
}
