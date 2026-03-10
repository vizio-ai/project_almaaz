import { UseCase, Result } from '@shared/kernel';
import { ChatRepository } from '../repositories/ChatRepository';
import { ChatSession } from '../entities/ChatSession';

export class GetChatSessionUseCase
  implements UseCase<string, ChatSession>
{
  constructor(private readonly repository: ChatRepository) {}

  execute(sessionId: string): Promise<Result<ChatSession>> {
    return this.repository.getSession(sessionId);
  }
}
