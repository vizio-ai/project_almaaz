import { UseCase, Result } from '@shared/kernel';
import { ChatRepository, SendChatMessageParams } from '../repositories/ChatRepository';
import { DoraResponse } from '../entities/ChatSession';

export class SendChatMessageUseCase
  implements UseCase<SendChatMessageParams, DoraResponse>
{
  constructor(private readonly repository: ChatRepository) {}

  execute(params: SendChatMessageParams): Promise<Result<DoraResponse>> {
    return this.repository.sendMessage(params);
  }
}
