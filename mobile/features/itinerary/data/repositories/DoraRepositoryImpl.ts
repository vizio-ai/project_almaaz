import { Result, ok, fail, networkError } from '@shared/kernel';
import { DoraRepository } from '../../domain/repositories/DoraRepository';
import { DoraMessage, DoraPersona, DoraReply } from '../../domain/entities/DoraMessage';
import { DoraRemoteDataSource } from '../datasources/DoraRemoteDataSource';

export class DoraRepositoryImpl implements DoraRepository {
  constructor(private readonly remoteDataSource: DoraRemoteDataSource) {}

  async sendMessage(params: {
    messages: DoraMessage[];
    persona?: DoraPersona | null;
    isOnboarding?: boolean;
  }): Promise<Result<DoraReply>> {
    try {
      const dto = await this.remoteDataSource.sendMessage({
        messages: params.messages,
        persona: params.persona,
        isOnboarding: params.isOnboarding,
      });
      return ok({ reply: dto.reply, isComplete: dto.isComplete });
    } catch (error) {
      return fail(networkError(error));
    }
  }
}
