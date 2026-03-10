import { UseCase, Result } from '@shared/kernel';
import { ChatRepository } from '../repositories/ChatRepository';
import { ChatSession } from '../entities/ChatSession';

export class GetUserSessionsUseCase
  implements UseCase<string, ChatSession[]>
{
  constructor(private readonly repository: ChatRepository) {}

  execute(userId: string): Promise<Result<ChatSession[]>> {
    return this.repository.getUserSessions(userId);
  }
}
