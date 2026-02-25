import { UseCase, Result } from '@shared/kernel';
import { DoraRepository } from '../repositories/DoraRepository';
import { DoraMessage, DoraPersona, DoraReply } from '../entities/DoraMessage';

export interface SendDoraMessageParams {
  messages: DoraMessage[];
  persona?: DoraPersona | null;
  isOnboarding?: boolean;
}

export class SendDoraMessageUseCase implements UseCase<SendDoraMessageParams, DoraReply> {
  constructor(private readonly repository: DoraRepository) {}

  execute(params: SendDoraMessageParams): Promise<Result<DoraReply>> {
    return this.repository.sendMessage(params);
  }
}
